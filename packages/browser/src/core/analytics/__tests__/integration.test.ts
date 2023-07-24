import { PriorityQueue } from '../../../lib/priority-queue'
import { MiddlewareParams } from '../../../plugins/middleware'
import {
  getAjsBrowserStorage,
  clearAjsBrowserStorage,
} from '../../../test-helpers/browser-storage'
import { Context } from '../../context'
import { Plugin } from '../../plugin'
import { EventQueue } from '../../queue/event-queue'
import { StoreType } from '../../storage'
import { Analytics } from '../index'
import jar from 'js-cookie'
import {
  TestAfterPlugin,
  TestBeforePlugin,
  TestDestinationPlugin,
  TestEnrichmentPlugin,
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
          const plugin = new TestBeforePlugin({ shouldThrow })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)
          const context = await analytics.track('test')
          expect(trackSpy).toHaveBeenCalledTimes(attemptCount)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        it(`"before" plugin errors should not throw (multiple dispatched events)`, async () => {
          const plugin = new TestBeforePlugin({ shouldThrow })
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
          const plugin = new TestBeforePlugin({ shouldThrow })
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
          new TestEnrichmentPlugin({ shouldThrow }),
          new TestDestinationPlugin({ shouldThrow }),
          new TestAfterPlugin({ shouldThrow }),
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
          const plugin = new TestBeforePlugin({ shouldCancel: true })
          const trackSpy = jest.spyOn(plugin, 'track')

          await analytics.register(plugin)

          const context = await analytics.track('test')
          expect(trackSpy).toHaveBeenCalledTimes(1)
          expect(context).toBeInstanceOf(Context)
          expect(context.failedDelivery()).toBeTruthy()
        })

        it('"before" plugin supports cancelation (multiple dispatched events)', async () => {
          const plugin = new TestBeforePlugin({ shouldCancel: true })
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

  describe('reset', () => {
    beforeEach(() => {
      clearAjsBrowserStorage()
    })

    it('clears user and group data', async () => {
      const analytics = new Analytics({ writeKey: '' })

      analytics.user().anonymousId('unknown-user')
      analytics.user().id('known-user')
      analytics.user().traits({ job: 'engineer' })
      analytics.group().id('known-group')
      analytics.group().traits({ team: 'analytics' })

      // Ensure all cookies/localstorage is written correctly first

      let storedData = getAjsBrowserStorage()
      expect(storedData).toEqual({
        ajs_user_id: 'known-user',
        ajs_anonymous_id: 'unknown-user',
        ajs_group_id: 'known-group',
        ajs_user_traits: {
          job: 'engineer',
        },
        ajs_group_properties: {
          team: 'analytics',
        },
      })

      // Now make sure everything was cleared on reset
      analytics.reset()
      storedData = getAjsBrowserStorage()
      expect(storedData).toEqual({})
    })

    it('emits a reset event', async () => {
      const analytics = new Analytics({ writeKey: '' })
      const fn = jest.fn()
      analytics.on('reset', fn)
      analytics.user().id('known-user')

      analytics.reset()
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('storage', () => {
    beforeEach(() => {
      clearAjsBrowserStorage()
    })

    it('handles custom priority storage', async () => {
      const setCookieSpy = jest.spyOn(jar, 'set')
      const expected = 'CookieValue'
      jar.set('ajs_anonymous_id', expected)
      localStorage.setItem('ajs_anonymous_id', 'localStorageValue')

      const analytics = new Analytics(
        { writeKey: '' },
        {
          storage: [StoreType.Cookie, StoreType.LocalStorage, StoreType.Memory],
        }
      )

      expect(analytics.user().anonymousId()).toEqual(expected)

      analytics.user().id('known-user')
      expect(analytics.user().id()).toEqual('known-user')
      expect(setCookieSpy).toHaveBeenCalled()
    })

    it('handles disabling storage', async () => {
      const setCookieSpy = jest.spyOn(jar, 'set')
      const expected = 'CookieValue'
      jar.set('ajs_anonymous_id', expected)
      localStorage.setItem('ajs_anonymous_id', 'localStorageValue')

      const analytics = new Analytics(
        { writeKey: '' },
        {
          storage: [StoreType.Cookie, StoreType.Memory],
        }
      )

      expect(analytics.user().anonymousId()).toEqual(expected)

      analytics.user().id('known-user')
      expect(analytics.user().id()).toEqual('known-user')
      expect(setCookieSpy).toHaveBeenCalled()
      // Local storage shouldn't change
      expect(localStorage.getItem('ajs_anonymous_id')).toBe('localStorageValue')
    })
  })
})
