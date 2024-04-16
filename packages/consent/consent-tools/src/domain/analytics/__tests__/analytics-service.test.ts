import { AnalyticsService, getInitializedAnalytics } from '../analytics-service'
import { analyticsMock } from '../../../test-helpers/mocks'
import { ValidationError } from '../../validation/validation-error'
import { add } from 'lodash'
import { Context } from '@segment/analytics-next'

describe(AnalyticsService, () => {
  let analyticsService: AnalyticsService

  describe('constructor', () => {
    it('should throw an error if the analytics instance is not valid', () => {
      // @ts-ignore
      expect(() => new AnalyticsService(undefined)).toThrowError(
        ValidationError
      )
    })
  })
  // eslint-disable-next-line jest/valid-describe-callback
  describe('getCategories validation', () => {
    ;[() => null, () => Promise.resolve(null)].forEach((getCategories) => {
      it(`should throw an error if getCategories returns an invalid value like ${getCategories.toString()} in addSourceMiddleware`, async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: () => null as any,
        })
        analyticsService.configureConsentStampingMiddleware()
        const addSourceMiddlewareSpy = jest.spyOn(
          analyticsMock,
          'addSourceMiddleware'
        )
        const middlewareFn = addSourceMiddlewareSpy.mock.calls[0][0]
        const nextFn = jest.fn()
        await expect(() =>
          middlewareFn({
            next: nextFn,
            payload: {
              // @ts-ignore
              obj: {
                context: {
                  ...new Context({ type: 'track' }),
                  consent: {
                    categoryPreferences: { C0001: true },
                  },
                },
              },
            },
          })
        ).rejects.toThrowError(/Validation/)
        expect(nextFn).not.toHaveBeenCalled()
      })
    })
  })

  it('should throw an error if getCategories returns an invalid async value', async () => {
    analyticsService = new AnalyticsService(analyticsMock, {
      getCategories: () => null as any,
    })
    analyticsService.configureConsentStampingMiddleware()
    const addSourceMiddlewareSpy = jest.spyOn(
      analyticsMock,
      'addSourceMiddleware'
    )
    const middlewareFn = addSourceMiddlewareSpy.mock.calls[0][0]
    const nextFn = jest.fn()
    await expect(() =>
      middlewareFn({
        next: nextFn,
        payload: {
          // @ts-ignore
          obj: {
            context: {
              ...new Context({ type: 'track' }),
              consent: {
                categoryPreferences: { C0001: true },
              },
            },
          },
        },
      })
    ).rejects.toThrowError(/Validation/)
    expect(nextFn).not.toHaveBeenCalled()
  })

  describe('load', () => {
    it('loads normally', () => {
      analyticsService = new AnalyticsService(analyticsMock, {
        getCategories: () => ({}),
      })
      analyticsService.load('foo')
      expect(analyticsMock.load).toBeCalled()
    })

    it('uses the correct value of *this*', () => {
      let that: any
      function fn(this: any) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        that = this
      }
      const _analyticsMock = {
        ...analyticsMock,
        load: fn,
        name: 'some instance',
      }
      analyticsService = new AnalyticsService(_analyticsMock, {
        getCategories: () => ({}),
      })
      analyticsService.load('foo')
      expect(that.name).toEqual('some instance')
    })

    describe('updateCDNSettings', () => {
      it('will gracefully handle updateCDNSettings if passed in', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: () => ({}),
        })
        analyticsService.load(
          {
            writeKey: 'foo',
          },
          {
            updateCDNSettings: (prevSettings) => ({
              bar: 'baz',
              ...prevSettings,
            }),
          }
        )
        // expect analytics.load to be called with theoptions correct settings
        const [_settings, options] = analyticsMock.load.mock.lastCall as any

        expect(typeof options.updateCDNSettings).toBe('function')
        expect(options.updateCDNSettings()).toEqual({ bar: 'baz' })
      })
    })

    it('will always call the original .load method', () => {
      const ogLoad = jest.fn()
      analyticsService = new AnalyticsService(
        {
          ...analyticsMock,
          load: ogLoad,
        },
        { getCategories: () => ({}) }
      )
      const replaceLoadMethod = jest.fn()
      analyticsService.replaceLoadMethod(replaceLoadMethod)
      analyticsService.load('foo')
      expect(ogLoad).toHaveBeenCalled()
      analyticsService.replaceLoadMethod(replaceLoadMethod)
      analyticsService.load('foo')
      expect(replaceLoadMethod).not.toBeCalled()
    })
  })

  describe('replaceLoadMethod', () => {
    it('should replace the load method with the provided function', () => {
      const replaceLoadMethod = jest.fn()
      analyticsService.replaceLoadMethod(replaceLoadMethod)
      expect(analyticsService['analytics'].load).toBe(replaceLoadMethod)
    })
  })

  describe('configureConsentStampingMiddleware', () => {
    // More tests are in create-wrapper.test.ts... should probably move the integration-y tests here
    it('should add the middleware to the analytics instance', () => {
      analyticsService = new AnalyticsService(analyticsMock, {
        getCategories: () => ({
          C0001: true,
        }),
      })
      analyticsService.configureConsentStampingMiddleware()

      expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledTimes(1)
      expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })

    it('should stamp consent', async () => {
      analyticsService = new AnalyticsService(analyticsMock, {
        pruneUnmappedCategories: false,
        getCategories: () => categories,
        integrationCategoryMappings: {
          foo: ['C0001'],
        },
      })

      analyticsService.configureConsentStampingMiddleware()
      const categories = {
        C0001: true,
        C0002: false,
        C0003: true,
      }
      // we are generating consent stamping source middleware and adding to the analytics instance, so test
      // that the addSourceMiddleware function is called with the correct function
      expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledTimes(1)
      const sourceMw = analyticsMock.addSourceMiddleware.mock.lastCall![0]
      expect(sourceMw).toBeInstanceOf(Function)
      // try running the source middleware
      const nextFn = jest.fn()
      await sourceMw({
        payload: {
          obj: {
            context: {},
          },
        },
        next: nextFn,
      })

      expect(nextFn.mock.lastCall[0]).toMatchInlineSnapshot(`
        {
          "obj": {
            "context": {
              "consent": {
                "categoryPreferences": {
                  "C0001": true,
                  "C0002": false,
                  "C0003": true,
                },
              },
            },
          },
        }
      `)
    })

    describe('pruneUnmappedCategories', () => {
      it('should prune categories that are not in the consent settings', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          pruneUnmappedCategories: true,
          getCategories: () => categories,
          integrationCategoryMappings: {
            foo: ['C0001'],
          },
        })

        analyticsService.configureConsentStampingMiddleware()
        const categories = {
          C0001: true,
          C0002: false,
          C0003: true,
        }
        // we are generating consent stamping source middleware and adding to the analytics instance, so test
        // that the addSourceMiddleware function is called with the correct function
        expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledTimes(1)
        const sourceMw = analyticsMock.addSourceMiddleware.mock.lastCall![0]
        expect(sourceMw).toBeInstanceOf(Function)
        // try running the source middleware
        const nextFn = jest.fn()
        await sourceMw({
          payload: {
            obj: {
              context: {},
            },
          },
          next: nextFn,
        })
        expect(nextFn.mock.lastCall[0]).toMatchInlineSnapshot(`
          {
            "obj": {
              "context": {
                "consent": {
                  "categoryPreferences": {
                    "C0001": true,
                  },
                },
              },
            },
          }
        `)
      })
    })
  })

  describe('configureBlockingMiddleware', () => {
    describe('addSourceMiddleware (used to block segment and everything else)', () => {
      it('should be called with the correct arguments', () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledTimes(1)
        expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledWith(
          expect.any(Function)
        )
      })
      it('drops events if user has no unmapped destinations and no relevant categories', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        analyticsService['cdnSettingsDeferred'].resolve({
          consentSettings: {
            allCategories: ['Foo'],
            hasUnmappedDestinations: false,
          },
          integrations: {
            foo: {
              consentSettings: {
                categories: ['Foo'], //
              },
            },
          },
        })
        expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledTimes(1)
        const sourceMw = analyticsMock.addSourceMiddleware.mock.lastCall![0]
        const nextFn = jest.fn()
        const payload = {
          obj: {
            context: {
              consent: {
                categoryPreferences: {
                  C0002: false,
                  C0003: false,
                },
              },
            },
          },
        }
        const result = await sourceMw({
          payload,
          next: nextFn,
        })
        expect(nextFn).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })

      it('is capable of allowing events through', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        analyticsService['cdnSettingsDeferred'].resolve({
          consentSettings: {
            allCategories: ['C0001'],
            hasUnmappedDestinations: false,
          },
          integrations: {
            foo: {
              consentSettings: {
                categories: ['C0001'], //
              },
            },
          },
        })
        expect(analyticsMock.addSourceMiddleware).toHaveBeenCalledTimes(1)
        const sourceMw = analyticsMock.addSourceMiddleware.mock.lastCall![0]
        const nextFn = jest.fn()
        const payload = {
          obj: {
            context: {
              consent: {
                categoryPreferences: {
                  C0001: true,
                },
              },
            },
          },
        }
        await sourceMw({
          payload,
          next: nextFn,
        })
        expect(nextFn.mock.lastCall[0]).toEqual(payload)
      })
    })
    describe('addDestinationMiddleware', () => {
      it('should be called with the correct arguments', () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        expect(analyticsMock.addDestinationMiddleware).toHaveBeenCalledTimes(1)
        expect(analyticsMock.addDestinationMiddleware).toHaveBeenCalledWith(
          '*',
          expect.any(Function)
        )
      })
      it('drops events', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        analyticsService['cdnSettingsDeferred'].resolve({
          integrations: {
            foo: {
              consentSettings: {
                categories: ['Foo'],
              },
            },
          },
        })

        const destinationMw =
          analyticsMock.addDestinationMiddleware.mock.lastCall![1]
        const nextFn = jest.fn()
        const payload = {
          obj: {
            context: {
              consent: {
                categoryPreferences: {
                  C0001: false,
                },
              },
            },
          },
        }
        const result = await destinationMw({
          integration: 'foo',
          payload,
          next: nextFn,
        })
        expect(nextFn).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })
      it('drops events if integrationCategoryMappings are defined', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
          integrationCategoryMappings: {
            foo: ['C0001'],
          },
        })

        analyticsService['cdnSettingsDeferred'].resolve({
          integrations: {},
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        expect(analyticsMock.addDestinationMiddleware).toHaveBeenCalledTimes(1)
        expect(analyticsMock.addDestinationMiddleware).toHaveBeenCalledWith(
          '*',
          expect.any(Function)
        )
        const destinationMw =
          analyticsMock.addDestinationMiddleware.mock.lastCall![1]
        const nextFn = jest.fn()
        const payload = {
          obj: {
            context: {
              consent: {
                categoryPreferences: {
                  C0001: false,
                },
              },
            },
          },
        }
        const result = await destinationMw({
          integration: 'foo',
          payload,
          next: nextFn,
        })
        expect(nextFn).not.toHaveBeenCalled()
        expect(result).toBeNull()
      })

      it('allows events through', async () => {
        analyticsService = new AnalyticsService(analyticsMock, {
          getCategories: jest.fn(),
          integrationCategoryMappings: {
            foo: ['C0001'],
          },
        })

        analyticsService['cdnSettingsDeferred'].resolve({
          integrations: {},
        })
        analyticsService.configureBlockingMiddlewareForOptOut()
        const destinationMw =
          analyticsMock.addDestinationMiddleware.mock.lastCall![1]
        const nextFn = jest.fn()
        const payload = {
          obj: {
            context: {
              consent: {
                categoryPreferences: {
                  C0001: true,
                },
              },
            },
          },
        }
        await destinationMw({
          integration: 'foo',
          payload,
          next: nextFn,
        })
        expect(nextFn.mock.lastCall[0]).toEqual(payload)
      })
    })
  })

  describe('consentChange', () => {
    it('should call the track method with the expected arguments', () => {
      const mockCategories = { C0001: true, C0002: false }
      analyticsService.consentChange(mockCategories)
      expect(analyticsMock.track).toBeCalledWith(
        'Segment Consent Preference',
        undefined,
        { consent: { categoryPreferences: mockCategories } }
      )
    })

    it('should log an error if the categories are invalid', () => {
      const mockCategories = { invalid: 'nope' } as any
      console.error = jest.fn()
      analyticsService.consentChange(mockCategories)
      expect(console.error).toBeCalledTimes(1)
      expect(console.error).toBeCalledWith(expect.any(ValidationError))
    })
  })
})

describe(getInitializedAnalytics, () => {
  beforeEach(() => {
    delete (window as any).analytics
    delete (window as any).foo
  })

  it('should return the window.analytics object if the snippet user passes a stale reference', () => {
    ;(window as any).analytics = { initialized: true }
    const analytics = [] as any
    expect(getInitializedAnalytics(analytics)).toEqual(
      (window as any).analytics
    )
  })

  it('should return the correct global analytics instance if the user has set a globalAnalyticsKey', () => {
    ;(window as any).foo = { initialized: true }
    const analytics = [] as any
    analytics._loadOptions = { globalAnalyticsKey: 'foo' }
    expect(getInitializedAnalytics(analytics)).toEqual((window as any).foo)
  })

  it('should return the buffered instance if analytics is not initialized', () => {
    const analytics = [] as any
    const globalAnalytics = { initialized: false }
    // @ts-ignore
    window['analytics'] = globalAnalytics
    expect(getInitializedAnalytics(analytics)).toEqual(analytics)
  })
  it('invariant: should not throw if global analytics is undefined', () => {
    ;(window as any).analytics = undefined
    const analytics = [] as any
    expect(getInitializedAnalytics(analytics)).toBe(analytics)
  })

  it('should return the analytics object if it is not an array', () => {
    const analytics = { initialized: false } as any
    expect(getInitializedAnalytics(analytics)).toBe(analytics)
  })
})
