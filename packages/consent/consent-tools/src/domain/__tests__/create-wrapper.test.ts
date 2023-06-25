import { createWrapper } from '../create-wrapper'
import { AbortLoadError, LoadContext } from '../load-cancellation'
import type {
  CreateWrapperOptions,
  AnyAnalytics,
  CDNSettings,
} from '../../types'
import { CDNSettingsBuilder } from '@internal/test-helpers'

const DEFAULT_LOAD_SETTINGS = {
  writeKey: 'foo',
  cdnSettings: { integrations: {} },
}
/**
 * Create consent settings for integrations
 */
const createConsentSettings = (categories: string[] = []) => ({
  consentSettings: {
    categories,
  },
})

const mockGetCategories: jest.MockedFn<CreateWrapperOptions['getCategories']> =
  jest.fn().mockImplementation(() => ({ Advertising: true }))

const analyticsLoadSpy: jest.MockedFn<AnyAnalytics['load']> = jest.fn()
const addSourceMiddlewareSpy = jest.fn()
let analyticsOnSpy: jest.MockedFn<AnyAnalytics['on']>
let consoleErrorSpy: jest.SpiedFunction<typeof console['error']>

const getAnalyticsLoadLastCall = () => {
  const [arg1, arg2] = analyticsLoadSpy.mock.lastCall
  const cdnSettings = arg1.cdnSettings
  const updateCDNSettings = arg2!.updateCDNSettings || ((id) => id)
  const updatedCDNSettings = updateCDNSettings(cdnSettings) as CDNSettings
  return {
    args: [arg1, arg2],
    cdnSettings,
    updatedCDNSettings,
  }
}

let analytics: AnyAnalytics, settingsBuilder: CDNSettingsBuilder
beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error')

  settingsBuilder = new CDNSettingsBuilder().addActionDestinationSettings({
    // add a default plugin just for safety
    creationName: 'nope',
    ...createConsentSettings(['Nope', 'Never']),
  })
  analyticsOnSpy = jest.fn().mockImplementation((event, fn) => {
    if (event === 'initialize') {
      fn(settingsBuilder.build())
    } else {
      console.error('event not recognized')
    }
  })

  class MockAnalytics implements AnyAnalytics {
    on = analyticsOnSpy
    load = analyticsLoadSpy
    addSourceMiddleware = addSourceMiddlewareSpy
  }
  analytics = new MockAnalytics()
})

const wrapTestAnalytics = (overrides: Partial<CreateWrapperOptions> = {}) =>
  createWrapper({
    getCategories: mockGetCategories,
    ...overrides,
  })(analytics)

describe(createWrapper, () => {
  it('should allow load arguments to be forwarded correctly from the patched analytics.load to the underlying load method', async () => {
    const mockCdnSettings = settingsBuilder.build()

    wrapTestAnalytics()

    const loadSettings1 = {
      ...DEFAULT_LOAD_SETTINGS,
      cdnSettings: mockCdnSettings,
    }
    const loadSettings2 = {
      anyOption: 'foo',
      updateCDNSettings: (cdnSettings: any) => ({
        ...cdnSettings,
        some_new_key: 123,
      }),
    }
    await analytics.load(loadSettings1, loadSettings2)
    const { args: loadCallArgs, updatedCDNSettings } =
      getAnalyticsLoadLastCall()
    const [loadedSettings1, loadedSettings2] = loadCallArgs
    expect(loadCallArgs.length).toBe(2)
    expect(loadedSettings1).toEqual(loadSettings1)

    expect(Object.keys(loadedSettings1)).toEqual(Object.keys(loadSettings1))

    expect(Object.keys(loadedSettings2)).toEqual(Object.keys(loadSettings2))
    expect(loadSettings2).toEqual(expect.objectContaining({ anyOption: 'foo' }))
    expect(updatedCDNSettings).toEqual(
      expect.objectContaining({ some_new_key: 123 })
    )
  })

  it('should invoke addSourceMiddleware in order to stamp the event', async () => {
    wrapTestAnalytics()
    await analytics.load(DEFAULT_LOAD_SETTINGS)
    expect(addSourceMiddlewareSpy).toBeCalledWith(expect.any(Function))
  })

  describe('shouldLoad', () => {
    describe('Throwing errors / aborting load', () => {
      const createShouldLoadThatThrows = (
        ...args: Parameters<LoadContext['abort']>
      ) => {
        let err: Error
        const shouldLoad = jest.fn().mockImplementation((ctx: LoadContext) => {
          try {
            ctx.abort(...args)
            throw new Error('Fail')
          } catch (_err: any) {
            err = _err
          }
        })
        return { shouldLoad, getError: () => err }
      }

      it('should throw a special error if ctx.abort is called', async () => {
        const { shouldLoad, getError } = createShouldLoadThatThrows({
          loadSegmentNormally: true,
        })
        wrapTestAnalytics({
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(getError() instanceof AbortLoadError).toBeTruthy()
      })

      it('should allow segment to be loaded normally (with all consent wrapper behavior disabled) via ctx.abort', async () => {
        wrapTestAnalytics({
          shouldLoad: (ctx) => {
            ctx.abort({
              loadSegmentNormally: true, // magic config option
            })
          },
        })

        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(analyticsLoadSpy).toBeCalled()
      })

      it('should allow segment loading to be completely aborted via ctx.abort', async () => {
        wrapTestAnalytics({
          shouldLoad: (ctx) => {
            ctx.abort({
              loadSegmentNormally: false, // magic config option
            })
            throw new Error('Fail')
          },
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(analyticsLoadSpy).not.toBeCalled()
      })
      it('should throw a validation error if ctx.abort is called incorrectly', async () => {
        const { getError, shouldLoad } = createShouldLoadThatThrows(
          undefined as any
        )
        wrapTestAnalytics({
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(getError().message).toMatch(/validation/i)
      })

      it('should not log a console error if error is thrown through ctx.abort', async () => {
        wrapTestAnalytics({
          shouldLoad: (ctx) => ctx.abort({ loadSegmentNormally: true }),
        })

        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(consoleErrorSpy).not.toBeCalled()
      })

      it('should log a console error if an unrecognized Error is thrown', async () => {
        consoleErrorSpy.mockImplementation(() => {})
        wrapTestAnalytics({
          shouldLoad: () => {
            throw new Error('hello')
          },
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(consoleErrorSpy).toBeCalledWith(new Error('hello'))
      })

      it('should result in segment never loading if an unrecognized error is thrown (same as ctx.abort({ loadSegmentNormally: false }))', async () => {
        wrapTestAnalytics({
          shouldLoad: () => {
            throw new Error('hello')
          },
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(analyticsLoadSpy).not.toBeCalled()
      })
    })
    it('should first call shouldLoad(), then wait for it to resolve/return before calling analytics.load()', async () => {
      const fnCalls: string[] = []
      analyticsLoadSpy.mockImplementationOnce(() => {
        fnCalls.push('analytics.load')
      })

      const shouldLoadMock: jest.Mock<undefined> = jest
        .fn()
        .mockImplementationOnce(async () => {
          fnCalls.push('shouldLoad')
        })

      wrapTestAnalytics({
        shouldLoad: shouldLoadMock,
      })

      await analytics.load(DEFAULT_LOAD_SETTINGS)
      expect(fnCalls).toEqual(['shouldLoad', 'analytics.load'])
    })
  })

  describe('getCategories', () => {
    test.each([
      {
        shouldLoad: () => undefined,
        returnVal: 'undefined',
      },
      {
        shouldLoad: () => Promise.resolve(undefined),
        returnVal: 'Promise<undefined>',
      },
    ])(
      'if shouldLoad() returns nil ($returnVal), intial categories will come from getCategories()',
      async ({ shouldLoad }) => {
        const mockCdnSettings = {
          integrations: {
            mockIntegration: {
              ...createConsentSettings(['Advertising']),
            },
          },
        }

        wrapTestAnalytics({
          shouldLoad: shouldLoad,
        })
        await analytics.load({
          ...DEFAULT_LOAD_SETTINGS,
          cdnSettings: mockCdnSettings,
        })

        const { updatedCDNSettings } = getAnalyticsLoadLastCall()
        expect(analyticsLoadSpy).toBeCalled()
        expect(updatedCDNSettings).toBeTruthy()
        expect(mockGetCategories).toBeCalled()
      }
    )

    test.each([
      {
        getCategories: () => ({ Advertising: true }),
        returnVal: 'Categories',
      },
      {
        getCategories: () => Promise.resolve({ Advertising: true }),
        returnVal: 'Promise<Categories>',
      },
    ])(
      'if shouldLoad() returns categories ($returnVal), those will be the initial categories',
      async ({ getCategories }) => {
        const mockCdnSettings = {
          integrations: {
            mockIntegration: {
              ...createConsentSettings(['Advertising']),
            },
          },
        }

        mockGetCategories.mockImplementationOnce(getCategories)

        wrapTestAnalytics({
          getCategories: mockGetCategories,
          shouldLoad: () => undefined,
        })
        await analytics.load({
          ...DEFAULT_LOAD_SETTINGS,
          cdnSettings: mockCdnSettings,
        })
        const { updatedCDNSettings } = getAnalyticsLoadLastCall()
        expect(analyticsLoadSpy).toBeCalled()
        expect(mockGetCategories).toBeCalled()
        expect(updatedCDNSettings).toBeTruthy()
      }
    )
  })

  describe('Validation', () => {
    it('should throw an error if categories are in the wrong format', async () => {
      wrapTestAnalytics({
        shouldLoad: () => Promise.resolve('sup' as any),
      })
      await expect(() => analytics.load(DEFAULT_LOAD_SETTINGS)).rejects.toThrow(
        /validation/i
      )
    })

    it('should throw an error if categories are undefined', async () => {
      wrapTestAnalytics({
        getCategories: () => undefined as any,
        shouldLoad: () => undefined,
      })
      await expect(() => analytics.load(DEFAULT_LOAD_SETTINGS)).rejects.toThrow(
        /validation/i
      )
    })
  })

  describe('Disabling/Enabling integrations before analytics initialization (device mode gating)', () => {
    it('should filter remote plugins based on consent settings', async () => {
      wrapTestAnalytics()
      const creationNameNoConsentData =
        'should.be.enabled.bc.no.consent.settings'
      const creationNameWithConsentMatch = 'should.be.enabled.bc.consent.match'
      const creationNameWithConsentMismatch = 'should.be.disabled'

      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings(
          {
            creationName: creationNameWithConsentMismatch,
            ...createConsentSettings(['Foo']),
          },
          {
            creationName: creationNameNoConsentData,
          },
          {
            creationName: creationNameWithConsentMatch,
            ...createConsentSettings(['Advertising']),
          }
        )
        .build()

      await analytics.load({
        ...DEFAULT_LOAD_SETTINGS,
        getCategories: () => ({ Advertising: true }),
        cdnSettings: mockCdnSettings,
      })

      expect(analyticsLoadSpy).toBeCalled()
      const { updatedCDNSettings } = getAnalyticsLoadLastCall()

      expect(typeof updatedCDNSettings.remotePlugins).toBe('object')
      // remote plugins should be filtered based on consent settings
      expect(updatedCDNSettings.remotePlugins).toEqual(
        mockCdnSettings.remotePlugins?.filter((p) =>
          // enabled consent
          [creationNameNoConsentData, creationNameWithConsentMatch].includes(
            p.creationName
          )
        )
      )

      // integrations should be untouched
      expect(updatedCDNSettings.integrations).toEqual(
        mockCdnSettings.integrations
      )
    })

    it('should allow integration if an integration has multiple categories, and user has multiple categories, but only consents to one', async () => {
      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings({
          creationName: 'mockIntegration',
          ...createConsentSettings(['Bar', 'Something else']),
        })
        .build()

      wrapTestAnalytics({
        shouldLoad: () => ({ Foo: true, Bar: true }),
      })
      await analytics.load({
        ...DEFAULT_LOAD_SETTINGS,
        cdnSettings: mockCdnSettings,
      })
      expect(analyticsLoadSpy).toBeCalled()
      const { updatedCDNSettings } = getAnalyticsLoadLastCall()
      // remote plugins should be filtered based on consent settings
      expect(updatedCDNSettings.remotePlugins).toEqual(
        mockCdnSettings.remotePlugins?.filter(
          (p) => p.creationName === 'mockIntegration'
        )
      )
    })

    it('should allow integration if it has multiple consent categories but user has only consented to one category', async () => {
      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings({
          creationName: 'mockIntegration',
          ...createConsentSettings(['Foo', 'Something else']),
        })
        .build()

      wrapTestAnalytics({
        shouldLoad: () => ({ Foo: true }),
      })
      await analytics.load({
        ...DEFAULT_LOAD_SETTINGS,
        cdnSettings: mockCdnSettings,
      })

      const { updatedCDNSettings } = getAnalyticsLoadLastCall()
      expect(updatedCDNSettings.remotePlugins).toEqual(
        mockCdnSettings.remotePlugins?.filter(
          (p) => p.creationName === 'mockIntegration'
        )
      )
    })
  })

  describe('disableConsentRequirement', () => {
    describe('if true on wrapper initialization', () => {
      it('should load analytics as usual', async () => {
        wrapTestAnalytics({
          disableConsentRequirement: () => true,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(analyticsLoadSpy).toBeCalled()
      })

      it('should not call shouldLoad if called on first', async () => {
        const shouldLoad = jest.fn()
        wrapTestAnalytics({
          disableConsentRequirement: () => true,
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(shouldLoad).not.toBeCalled()
      })

      it('should work with promises if false', async () => {
        const shouldLoad = jest.fn()
        wrapTestAnalytics({
          disableConsentRequirement: () => Promise.resolve(false),
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(shouldLoad).toBeCalled()
      })

      it('should work with promises if true', async () => {
        const shouldLoad = jest.fn()
        wrapTestAnalytics({
          disableConsentRequirement: () => Promise.resolve(true),
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(shouldLoad).not.toBeCalled()
      })

      it('should forward all arguments to the original analytics.load method', async () => {
        const mockCdnSettings = settingsBuilder.build()

        wrapTestAnalytics({
          disableConsentRequirement: () => true,
        })

        const loadArgs: [any, any] = [
          {
            ...DEFAULT_LOAD_SETTINGS,
            cdnSettings: mockCdnSettings,
          },
          {},
        ]
        await analytics.load(...loadArgs)
        expect(analyticsLoadSpy).toBeCalled()
        expect(getAnalyticsLoadLastCall().args).toEqual(loadArgs)
      })

      it('should not stamp the event with consent info', async () => {
        wrapTestAnalytics({
          disableConsentRequirement: () => true,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(addSourceMiddlewareSpy).not.toBeCalled()
      })
    })
  })

  describe('disableSegmentInitialization', () => {
    it('should load analytics if disableAll returns false', async () => {
      wrapTestAnalytics({
        disableSegmentInitialization: () => false,
      })
      await analytics.load(DEFAULT_LOAD_SETTINGS)
      expect(analyticsLoadSpy).toBeCalled()
    })

    it('should not load analytics if disableAll returns true', async () => {
      wrapTestAnalytics({
        disableSegmentInitialization: () => true,
      })
      await analytics.load(DEFAULT_LOAD_SETTINGS)
      expect(mockGetCategories).not.toBeCalled()
      expect(addSourceMiddlewareSpy).not.toBeCalled()
      expect(analyticsLoadSpy).not.toBeCalled()
    })
  })

  describe('shouldEnableIntegration', () => {
    it('should let user customize the logic that determines whether or not a destination is enabled', async () => {
      const disabledDestinationCreationName = 'DISABLED'
      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings(
          {
            creationName: disabledDestinationCreationName,
          },
          { creationName: 'ENABLED' }
        )
        .build()

      wrapTestAnalytics({
        shouldEnableIntegration: (categories, consentedCategories, plugin) => {
          if (plugin.creationName === disabledDestinationCreationName)
            return false
          if (!categories.length) return true
          return categories.some((c) => consentedCategories[c])
        },
      })
      await analytics.load({
        ...DEFAULT_LOAD_SETTINGS,
        cdnSettings: mockCdnSettings,
      })
      const { updatedCDNSettings } = getAnalyticsLoadLastCall()
      const foundIntg = updatedCDNSettings.remotePlugins?.find(
        (el) => el.creationName === 'ENABLED'
      )
      expect(foundIntg).toBeTruthy()
      const disabledIntg = updatedCDNSettings.remotePlugins?.find(
        (el) => el.creationName === disabledDestinationCreationName
      )
      expect(disabledIntg).toBeFalsy()
    })
  })
})
