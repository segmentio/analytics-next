import { PriorityQueue } from '../../../lib/priority-queue'
import { MiddlewareParams } from '../../../plugins/middleware'
import { Context } from '../../context'
import { Plugin } from '../../plugin'
import { EventQueue } from '../../queue/event-queue'
import { Analytics } from '../index'
import {
  AfterPlugin,
  BeforePlugin,
  DestinationPlugin,
  EnrichmentPlugin,
} from './test-plugins'

describe('Analytics', () => {
  describe('plugin error behavior', () => {
    const retriesEnabledScenarios = [true, false]
    retriesEnabledScenarios.forEach((retriesEnabled) => {
      describe(`with retries ${
        retriesEnabled ? 'enabled' : 'disabled'
      }`, () => {
        let analytics: Analytics
        const attemptCount = retriesEnabled ? 2 : 1

        beforeEach(() => {
          const queue = new EventQueue(new PriorityQueue(attemptCount, []))
          analytics = new Analytics({ writeKey: 'writeKey' }, {}, queue)
        })

        // Indicates plugins should throw
        const shouldThrow = true

        it(`"before" plugin errors should not throw (single dispatched event)`, async () => {
          const plugin = new BeforePlugin({ shouldThrow })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)
          const context = await analytics.track('test')
          expect(trackSpy).toHaveBeenCalledTimes(attemptCount)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        it(`"before" plugin errors should not throw (multiple dispatched events)`, async () => {
          const plugin = new BeforePlugin({ shouldThrow })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)
          const contexts = await Promise.all([
            analytics.track('test1'),
            analytics.track('test2'),
            analytics.track('test3'),
          ])
          expect(trackSpy).toHaveBeenCalledTimes(3 * attemptCount)

          for (const context of contexts) {
            expect(context).toBeInstanceOf(Context)
            expect(context.failedDelivery()).toBeTruthy()
          }
        })

        it(`"before" plugin errors should not impact callbacks`, async () => {
          const plugin = new BeforePlugin({ shouldThrow })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)

          const context = await new Promise<Context>((resolve) => {
            void analytics.track('test', resolve)
          })

          expect(trackSpy).toHaveBeenCalledTimes(attemptCount)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        if (retriesEnabled) {
          it(`will not mark delivery failed if retry succeeds`, async () => {
            const plugin: Plugin = {
              name: 'Test Retries Plugin',
              type: 'before',
              version: '1.0.0',
              isLoaded: () => true,
              load: () => Promise.resolve(),
              track: jest.fn((ctx) => {
                if (ctx.attempts < attemptCount) {
                  throw new Error(`Plugin failed!`)
                }
                return ctx
              }),
            }
            await analytics.register(plugin)

            const context = await analytics.track('test')
            expect(plugin.track).toHaveBeenCalledTimes(attemptCount)
            expect(context).toBeInstanceOf(Context)
            expect(context.failedDelivery()).toBeFalsy()
          })
        }

        const testPlugins = [
          new EnrichmentPlugin({ shouldThrow }),
          new DestinationPlugin({ shouldThrow }),
          new AfterPlugin({ shouldThrow }),
        ]
        testPlugins.forEach((plugin) => {
          it(`"${plugin.type}" plugin errors should not throw (single dispatched event)`, async () => {
            const trackSpy = jest.spyOn(plugin, 'track')

            await analytics.register(plugin)

            const context = await analytics.track('test')
            expect(trackSpy).toHaveBeenCalledTimes(1)
            expect(context).toBeInstanceOf(Context)
            expect(context.failedDelivery()).toBeFalsy()
          })

          it(`"${plugin.type}" plugin errors should not throw (multiple dispatched events)`, async () => {
            const trackSpy = jest.spyOn(plugin, 'track')

            await analytics.register(plugin)

            const contexts = await Promise.all([
              analytics.track('test1'),
              analytics.track('test2'),
              analytics.track('test3'),
            ])

            expect(trackSpy).toHaveBeenCalledTimes(3)
            for (const context of contexts) {
              expect(context).toBeInstanceOf(Context)
              expect(context.failedDelivery()).toBeFalsy()
            }
          })

          it(`"${plugin.type}" plugin errors should not impact callbacks`, async () => {
            const trackSpy = jest.spyOn(plugin, 'track')

            await analytics.register(plugin)

            const context = await new Promise<Context>((resolve) => {
              void analytics.track('test', resolve)
            })

            expect(trackSpy).toHaveBeenCalledTimes(1)
            expect(context).toBeInstanceOf(Context)
            expect(context.failedDelivery()).toBeFalsy()
          })
        })

        it('"before" plugin supports cancelation (single dispatched event)', async () => {
          const plugin = new BeforePlugin({ shouldCancel: true })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)

          const context = await analytics.track('test')
          expect(trackSpy).toHaveBeenCalledTimes(1)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        it('"before" plugin supports cancelation (multiple dispatched events)', async () => {
          const plugin = new BeforePlugin({ shouldCancel: true })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)
          const contexts = await Promise.all([
            analytics.track('test1'),
            analytics.track('test2'),
            analytics.track('test3'),
          ])
          expect(trackSpy).toHaveBeenCalledTimes(3)

          for (const context of contexts) {
            expect(context).toBeInstanceOf(Context)
            expect(context.failedDelivery()).toBeTruthy()
          }
        })

        it(`source middleware should not throw when "next" not called`, async () => {
          const sourceMiddleware = jest.fn<void, MiddlewareParams[]>(() => {})

          await analytics.addSourceMiddleware(sourceMiddleware)

          const context = await analytics.track('test')

          expect(sourceMiddleware).toHaveBeenCalledTimes(1)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        it(`source middleware errors should not throw`, async () => {
          const sourceMiddleware = jest.fn<void, MiddlewareParams[]>(() => {
            throw new Error('Source middleware error')
          })

          await analytics.addSourceMiddleware(sourceMiddleware)

          const context = await analytics.track('test')

          expect(sourceMiddleware).toHaveBeenCalledTimes(1 * attemptCount)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        it(`source middleware errors should not impact callbacks`, async () => {
          const sourceMiddleware = jest.fn<void, MiddlewareParams[]>(() => {
            throw new Error('Source middleware error')
          })

          await analytics.addSourceMiddleware(sourceMiddleware)

          const context = await new Promise<Context>((resolve) => {
            void analytics.track('test', resolve)
          })

          expect(sourceMiddleware).toHaveBeenCalledTimes(1 * attemptCount)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })
      })
    })
  })
})
