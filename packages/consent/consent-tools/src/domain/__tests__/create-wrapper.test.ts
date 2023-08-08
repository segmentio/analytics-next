import * as ConsentStamping from '../consent-stamping'
import { createWrapper } from '../create-wrapper'
import { AbortLoadError, LoadContext } from '../load-cancellation'
import type {
  CreateWrapperSettings,
  AnyAnalytics,
  CDNSettings,
  AnalyticsBrowserSettings,
} from '../../types'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { assertIntegrationsContainOnly } from './assertions/integrations-assertions'

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

const mockGetCategories: jest.MockedFn<CreateWrapperSettings['getCategories']> =
  jest.fn().mockImplementation(() => ({ Advertising: true }))

const analyticsLoadSpy: jest.MockedFn<AnyAnalytics['load']> = jest.fn()
const addSourceMiddlewareSpy = jest.fn()
let analyticsOnSpy: jest.MockedFn<AnyAnalytics['on']>
let consoleErrorSpy: jest.SpiedFunction<typeof console['error']>

const getAnalyticsLoadLastCall = () => {
  const [arg1, arg2] = analyticsLoadSpy.mock.lastCall
  const cdnSettings = (arg1 as any).cdnSettings as CDNSettings
  const updateCDNSettings = arg2!.updateCDNSettings || ((id) => id)
  const updatedCDNSettings = updateCDNSettings(cdnSettings) as CDNSettings
  return {
    args: [arg1 as AnalyticsBrowserSettings, arg2!] as const,
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

const wrapTestAnalytics = (overrides: Partial<CreateWrapperSettings> = {}) =>
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

      it.each([{ loadSegmentNormally: true }, { loadSegmentNormally: false }])(
        `should not log a console error or throw an error if ctx.abort is called (%p)`,
        async (args) => {
          wrapTestAnalytics({
            shouldLoad: (ctx) => ctx.abort(args),
          })
          const result = await analytics.load(DEFAULT_LOAD_SETTINGS)
          expect(result).toBeUndefined()
          expect(consoleErrorSpy).not.toBeCalled()
        }
      )

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

      it('An unrecognized Error (non-consent) error should bubble up, but we should not log any additional console error', async () => {
        const err = new Error('hello')
        wrapTestAnalytics({
          shouldLoad: () => {
            throw err
          },
        })

        await expect(() =>
          analytics.load(DEFAULT_LOAD_SETTINGS)
        ).rejects.toThrow(err)

        expect(consoleErrorSpy).not.toBeCalled()
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
        cdnSettings: mockCdnSettings,
      })

      expect(analyticsLoadSpy).toBeCalled()
      const { updatedCDNSettings } = getAnalyticsLoadLastCall()

      expect(typeof updatedCDNSettings.remotePlugins).toBe('object')

      // remote plugins should be filtered based on consent settings
      assertIntegrationsContainOnly(
        [creationNameNoConsentData, creationNameWithConsentMatch],
        mockCdnSettings,
        updatedCDNSettings
      )
    })

    it('should allow integration if it has one category and user has consented to that category', async () => {
      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings({
          creationName: 'mockIntegration',
          ...createConsentSettings(['Foo']),
        })
        .build()

      wrapTestAnalytics({
        shouldLoad: () => ({ Foo: true }),
      })
      await analytics.load({
        ...DEFAULT_LOAD_SETTINGS,
        cdnSettings: mockCdnSettings,
      })
      expect(analyticsLoadSpy).toBeCalled()
      const { updatedCDNSettings } = getAnalyticsLoadLastCall()
      // remote plugins should be filtered based on consent settings
      assertIntegrationsContainOnly(
        ['mockIntegration'],
        mockCdnSettings,
        updatedCDNSettings
      )
    })

    it('should allow integration if it has multiple categories and user consents to all of them.', async () => {
      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings({
          creationName: 'mockIntegration',
          ...createConsentSettings(['Foo', 'Bar']),
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
      assertIntegrationsContainOnly(
        ['mockIntegration'],
        mockCdnSettings,
        updatedCDNSettings
      )
    })

    it('should disable integration if it has multiple categories but user has only consented to one', async () => {
      const mockCdnSettings = settingsBuilder
        .addActionDestinationSettings({
          creationName: 'mockIntegration',
          ...createConsentSettings(['Foo', 'Bar']),
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
      assertIntegrationsContainOnly(
        ['mockIntegation'],
        mockCdnSettings,
        updatedCDNSettings
      )
    })
  })

  describe('shouldDisableConsentRequirement', () => {
    describe('if true on wrapper initialization', () => {
      it('should load analytics as usual', async () => {
        wrapTestAnalytics({
          shouldDisableConsentRequirement: () => true,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(analyticsLoadSpy).toBeCalled()
      })

      it('should not call shouldLoad if called on first', async () => {
        const shouldLoad = jest.fn()
        wrapTestAnalytics({
          shouldDisableConsentRequirement: () => true,
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(shouldLoad).not.toBeCalled()
      })

      it('should work with promises if false', async () => {
        const shouldLoad = jest.fn()
        wrapTestAnalytics({
          shouldDisableConsentRequirement: () => Promise.resolve(false),
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(shouldLoad).toBeCalled()
      })

      it('should work with promises if true', async () => {
        const shouldLoad = jest.fn()
        wrapTestAnalytics({
          shouldDisableConsentRequirement: () => Promise.resolve(true),
          shouldLoad,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(shouldLoad).not.toBeCalled()
      })

      it('should forward all arguments to the original analytics.load method', async () => {
        const mockCdnSettings = settingsBuilder.build()

        wrapTestAnalytics({
          shouldDisableConsentRequirement: () => true,
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
          shouldDisableConsentRequirement: () => true,
        })
        await analytics.load(DEFAULT_LOAD_SETTINGS)
        expect(addSourceMiddlewareSpy).not.toBeCalled()
      })
    })
  })

  describe('shouldDisableSegment', () => {
    it('should load analytics if disableAll returns false', async () => {
      wrapTestAnalytics({
        shouldDisableSegment: () => false,
      })
      await analytics.load(DEFAULT_LOAD_SETTINGS)
      expect(analyticsLoadSpy).toBeCalled()
    })

    it('should not load analytics if disableAll returns true', async () => {
      wrapTestAnalytics({
        shouldDisableSegment: () => true,
      })
      await analytics.load(DEFAULT_LOAD_SETTINGS)
      expect(mockGetCategories).not.toBeCalled()
      expect(addSourceMiddlewareSpy).not.toBeCalled()
      expect(analyticsLoadSpy).not.toBeCalled()
    })
  })
  test.each([
    {
      getCategories: () =>
        ({
          invalidCategory: 'hello',
        } as any),
      returnVal: 'Categories',
    },
    {
      getCategories: () =>
        Promise.resolve({
          invalidCategory: 'hello',
        }) as any,
      returnVal: 'Promise<Categories>',
    },
  ])(
    'should throw an error if getCategories() returns invalid categories during consent stamping ($returnVal))',
    async ({ getCategories }) => {
      const fn = jest.spyOn(ConsentStamping, 'createConsentStampingMiddleware')
      const mockCdnSettings = settingsBuilder.build()

      wrapTestAnalytics({
        getCategories,
        shouldLoad: () => {
          // on first load, we should not get an error because this is a valid category setting
          return { invalidCategory: true }
        },
      })
      await analytics.load({
        ...DEFAULT_LOAD_SETTINGS,
        cdnSettings: mockCdnSettings,
      })

      const getCategoriesFn = fn.mock.lastCall[0]
      await expect(getCategoriesFn()).rejects.toMatchInlineSnapshot(
        `[ValidationError: [Validation] Consent Categories should be {[categoryName: string]: boolean} (Received: {"invalidCategory":"hello"})]`
      )
    }
  )

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
      assertIntegrationsContainOnly(
        ['ENABLED'],
        mockCdnSettings,
        updatedCDNSettings
      )
    })
  })

  describe('Consent Stamping', () => {
    test.each([
      {
        getCategories: () => ({
          Something: true,
          SomethingElse: false,
        }),
        returnVal: 'Categories',
      },
      {
        getCategories: () =>
          Promise.resolve({
            Something: true,
            SomethingElse: false,
          }),
        returnVal: 'Promise<Categories>',
      },
    ])(
      'should, by default, stamp the event with _all_ consent info if getCategories returns $returnVal',
      async ({ getCategories }) => {
        const fn = jest.spyOn(
          ConsentStamping,
          'createConsentStampingMiddleware'
        )
        const mockCdnSettings = settingsBuilder.build()

        wrapTestAnalytics({
          getCategories,
        })
        await analytics.load({
          ...DEFAULT_LOAD_SETTINGS,
          cdnSettings: mockCdnSettings,
        })

        const getCategoriesFn = fn.mock.lastCall[0]
        await expect(getCategoriesFn()).resolves.toEqual({
          Something: true,
          SomethingElse: false,
        })
      }
    )

    describe('pruneUnmappedCategories', () => {
      it('should throw an error if there are no configured categories', async () => {
        const fn = jest.spyOn(
          ConsentStamping,
          'createConsentStampingMiddleware'
        )
        const mockCdnSettings = settingsBuilder
          .addActionDestinationSettings({
            creationName: 'Some Other Plugin',
          })
          .build()

        wrapTestAnalytics({ pruneUnmappedCategories: true })
        await analytics.load({
          ...DEFAULT_LOAD_SETTINGS,
          cdnSettings: mockCdnSettings,
        })

        const getCategoriesFn = fn.mock.lastCall[0]
        await expect(() =>
          getCategoriesFn()
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `"[Validation] Invariant: No consent categories defined in Segment (Received: [])"`
        )
      })

      it('should exclude properties that are not configured based on the allCategories array', async () => {
        const fn = jest.spyOn(
          ConsentStamping,
          'createConsentStampingMiddleware'
        )
        const mockCdnSettings = settingsBuilder
          .addActionDestinationSettings({
            creationName: 'Some Other Plugin',
            ...createConsentSettings(['Foo']),
          })
          .build()

        ;(mockCdnSettings as any).consentSettings = {
          allCategories: ['Foo', 'Bar'],
        }

        wrapTestAnalytics({
          pruneUnmappedCategories: true,
          getCategories: () => ({
            Foo: true,
            Bar: false,
            Rand1: false,
            Rand2: true,
          }),
        })
        await analytics.load({
          ...DEFAULT_LOAD_SETTINGS,
          cdnSettings: mockCdnSettings,
        })

        const getCategoriesFn = fn.mock.lastCall[0]
        await expect(getCategoriesFn()).resolves.toEqual({
          Foo: true,
          Bar: false,
        })
      })

      it('should exclude properties that are not configured if integrationCategoryMappings are passed', async () => {
        const fn = jest.spyOn(
          ConsentStamping,
          'createConsentStampingMiddleware'
        )
        const mockCdnSettings = settingsBuilder
          .addActionDestinationSettings({
            creationName: 'Some Other Plugin',
          })
          .build()

        wrapTestAnalytics({
          pruneUnmappedCategories: true,
          getCategories: () => ({
            Foo: true,
            Rand1: true,
            Rand2: false,
          }),
          integrationCategoryMappings: {
            'Some Other Plugin': ['Foo'],
          },
        })
        await analytics.load({
          ...DEFAULT_LOAD_SETTINGS,
          cdnSettings: mockCdnSettings,
        })

        const getCategoriesFn = fn.mock.lastCall[0]
        await expect(getCategoriesFn()).resolves.toEqual({ Foo: true })
      })
    })
  })
})
