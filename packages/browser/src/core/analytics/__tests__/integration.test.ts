import { PriorityQueue } from '../../../lib/priority-queue'
import { MiddlewareParams } from '../../../plugins/middleware'
import { Context } from '../../context'
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

        beforeEach(() => {
          const queue = new EventQueue(
            new PriorityQueue(retriesEnabled ? 3 : 1, [])
          )
          analytics = new Analytics({ writeKey: 'writeKey' }, {}, queue)
        })

        // Indicates plugins should throw
        const shouldThrow = true
        const testPlugins = [
          new BeforePlugin({ shouldThrow }),
          new EnrichmentPlugin({ shouldThrow }),
          new DestinationPlugin({ shouldThrow }),
          new AfterPlugin({ shouldThrow }),
        ]

        testPlugins.forEach((plugin) => {
          it(`"${plugin.type}" plugin errors should not throw (single dispatched event)`, async () => {
            const trackSpy = jest.spyOn(plugin, 'track')

            await analytics.register(plugin)
            await expect(analytics.track('test')).resolves.toBeInstanceOf(
              Context
            )

            expect(trackSpy).toHaveBeenCalledTimes(1)
          })

          it(`"${plugin.type}" plugin errors should not throw (multiple dispatched events)`, async () => {
            const trackSpy = jest.spyOn(plugin, 'track')

            await analytics.register(plugin)
            await Promise.all([
              expect(analytics.track('test1')).resolves.toBeInstanceOf(Context),
              expect(analytics.track('test2')).resolves.toBeInstanceOf(Context),
              expect(analytics.track('test3')).resolves.toBeInstanceOf(Context),
            ])

            expect(trackSpy).toHaveBeenCalledTimes(3)
          })
        })

        it(`source middleware should not throw when "next" not called`, async () => {
          const sourceMiddleware = jest.fn<void, MiddlewareParams[]>(() => {})

          await analytics.addSourceMiddleware(sourceMiddleware)

          await expect(analytics.track('test')).resolves.toBeInstanceOf(Context)

          expect(sourceMiddleware).toHaveBeenCalledTimes(1)
        })

        it(`source middleware errors should not throw`, async () => {
          const sourceMiddleware = jest.fn<void, MiddlewareParams[]>(() => {
            throw new Error('Source middleware error')
          })

          await analytics.addSourceMiddleware(sourceMiddleware)

          await expect(analytics.track('test')).resolves.toBeInstanceOf(Context)

          expect(sourceMiddleware).toHaveBeenCalledTimes(1)
        })
      })
    })
  })
})
