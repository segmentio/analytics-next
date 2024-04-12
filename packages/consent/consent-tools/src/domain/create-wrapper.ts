import {
  Categories,
  CreateWrapper,
  AnyAnalytics,
  InitOptions,
  CDNSettings,
} from '../types'
import { validateCategories, validateSettings } from './validation'
import { pipe } from '../utils'
import { normalizeShouldLoadSegment } from './load-context'
import { AnalyticsService } from './analytics'
import {
  filterDeviceModeDestinationsForOptIn,
  segmentShouldBeDisabled,
} from './blocking-helpers'
import { logger } from './logger'

export const createWrapper = <Analytics extends AnyAnalytics>(
  ...[createWrapperSettings]: Parameters<CreateWrapper<Analytics>>
): ReturnType<CreateWrapper<Analytics>> => {
  validateSettings(createWrapperSettings)

  const {
    shouldDisableSegment,
    getCategories,
    shouldLoadSegment,
    integrationCategoryMappings,
    shouldEnableIntegration,
    registerOnConsentChanged,
    shouldLoadWrapper,
    enableDebugLogging,
  } = createWrapperSettings

  return (analytics: Analytics) => {
    const analyticsService = new AnalyticsService(analytics, {
      integrationCategoryMappings,
      getCategories,
    })

    if (enableDebugLogging) {
      logger.enableDebugLogging()
    }

    const loadWrapper = shouldLoadWrapper?.() || Promise.resolve()
    void loadWrapper.then(() => {
      // Call this function as early as possible. OnConsentChanged events can happen before .load is called.
      registerOnConsentChanged?.((categories) =>
        // whenever consent changes, dispatch a new event with the latest consent information
        analyticsService.consentChange(categories)
      )
    })

    // Create new load method to handle consent that will replace the original on the analytics instance
    const loadWithConsent: AnyAnalytics['load'] = async (
      settings,
      options
    ): Promise<void> => {
      // Prevent stale page context by handling initialPageview ourself.
      // By calling page() here early, the current page context (url, etc) gets stored in the pre-init buffer.
      // We then set initialPageView to false when we call the underlying analytics library, so page() doesn't get called twice.
      if (options?.initialPageview) {
        analyticsService.page()
        options = { ...options, initialPageview: false }
      }

      // do not load anything -- segment included
      if (await shouldDisableSegment?.()) {
        return
      }

      await loadWrapper
      const loadCtx = await normalizeShouldLoadSegment(shouldLoadSegment)()

      // if abort is called, we can either load segment normally or not load at all
      // if user must opt-out of tracking, we load as usual and then rely on the consent blocking middleware to block events
      if (loadCtx.isAbortCalled) {
        if (loadCtx.abortLoadOptions?.loadSegmentNormally === true) {
          analyticsService.load(settings, options)
        }
        return undefined
      }

      // register listener to stamp all events with latest consent information
      analyticsService.configureConsentStampingMiddleware()

      // if opt-out, we load as usual and then rely on the consent blocking middleware to block events
      // if opt-in, we remove all destinations that are not explicitly consented to so they never load in the first place
      if (loadCtx.loadOptions.optIn === false) {
        analyticsService.configureBlockingMiddlewareForOptOut()
        analyticsService.load(settings, options)
        return undefined
      } else {
        const initialCategories = await getCategories()
        validateCategories(initialCategories)

        analyticsService.load(settings, {
          ...options,
          updateCDNSettings: pipe((cdnSettings) => {
            if (!cdnSettings.remotePlugins) {
              return cdnSettings
            }

            return filterDeviceModeDestinationsForOptIn(
              cdnSettings,
              initialCategories,
              { integrationCategoryMappings, shouldEnableIntegration }
            )
          }, options?.updateCDNSettings || ((id) => id)),
          disable: createDisableOption(initialCategories, options?.disable),
        })
        return undefined
      }
    }

    analyticsService.replaceLoadMethod(loadWithConsent)
    return analytics
  }
}

/**
 * Allow for gracefully passing a custom disable function (without clobbering the default behavior)
 */
const createDisableOption = (
  initialCategories: Categories,
  disable: InitOptions['disable']
): NonNullable<InitOptions['disable']> => {
  if (disable === true) {
    return true
  }
  return (cdnSettings: CDNSettings) => {
    return (
      segmentShouldBeDisabled(initialCategories, cdnSettings.consentSettings) ||
      (typeof disable === 'function' ? disable(cdnSettings) : false)
    )
  }
}
