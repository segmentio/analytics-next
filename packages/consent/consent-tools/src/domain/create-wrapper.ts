import {
  Categories,
  CreateWrapper,
  AnyAnalytics,
  InitOptions,
  CreateWrapperSettings,
  CDNSettings,
} from '../types'
import { validateCategories, validateSettings } from './validation'
import { pipe } from '../utils'
import { AbortLoadError, LoadContext } from './load-cancellation'
import { AnalyticsService } from './analytics'
import { segmentShouldBeDisabled } from './disable-segment'

export const createWrapper = <Analytics extends AnyAnalytics>(
  ...[createWrapperSettings]: Parameters<CreateWrapper<Analytics>>
): ReturnType<CreateWrapper<Analytics>> => {
  validateSettings(createWrapperSettings)

  const {
    shouldDisableSegment,
    getCategories,
    shouldLoadSegment,
    integrationCategoryMappings,
    pruneUnmappedCategories,
    shouldEnableIntegration,
    registerOnConsentChanged,
    shouldLoadWrapper,
  } = createWrapperSettings

  return (analytics: Analytics) => {
    const analyticsService = new AnalyticsService(analytics)
    const loadWrapper = shouldLoadWrapper?.() || Promise.resolve()
    void loadWrapper.then(() => {
      // Call this function as early as possible. OnConsentChanged events can happen before .load is called.
      registerOnConsentChanged?.((categories) =>
        // whenever consent changes, dispatch a new event with the latest consent information
        analyticsService.consentChange(categories)
      )
    })

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

      // use these categories to disable/enable the appropriate device mode plugins
      let initialCategories: Categories
      try {
        await loadWrapper
        initialCategories =
          (await shouldLoadSegment?.(new LoadContext())) ||
          (await getCategories())
      } catch (e: unknown) {
        // consumer can call ctx.abort({ loadSegmentNormally: true })
        // to load Segment but disable consent requirement
        if (e instanceof AbortLoadError) {
          if (e.loadSegmentNormally === true) {
            analyticsService.loadNormally(settings, options)
          }
          // do not load anything, but do not log anything either
          // if someone calls ctx.abort(), they are handling the error themselves
          return
        } else {
          throw e
        }
      }

      validateCategories(initialCategories)

      // register listener to stamp all events with latest consent information
      analyticsService.configureConsentStampingMiddleware({
        getCategories,
        integrationCategoryMappings,
        pruneUnmappedCategories,
      })

      const updateCDNSettings: InitOptions['updateCDNSettings'] = (
        cdnSettings
      ) => {
        if (!cdnSettings.remotePlugins) {
          return cdnSettings
        }

        return disableIntegrations(
          cdnSettings,
          initialCategories,
          integrationCategoryMappings,
          shouldEnableIntegration
        )
      }

      return analyticsService.loadNormally(settings, {
        ...options,
        updateCDNSettings: pipe(
          updateCDNSettings,
          options?.updateCDNSettings || ((id) => id)
        ),
        disable: createDisableOption(initialCategories, options?.disable),
      })
    }
    analyticsService.replaceLoadMethod(loadWithConsent)
    return analytics
  }
}

/**
 * Parse list of categories from `cdnSettings.integration.myIntegration` object
 * @example
 * returns ["Analytics", "Advertising"]
 */
const getConsentCategories = (integration: unknown): string[] | undefined => {
  if (
    integration &&
    typeof integration === 'object' &&
    'consentSettings' in integration &&
    typeof integration.consentSettings === 'object' &&
    integration.consentSettings &&
    'categories' in integration.consentSettings &&
    Array.isArray(integration.consentSettings.categories)
  ) {
    return (integration.consentSettings.categories as string[]) || undefined
  }

  return undefined
}

const disableIntegrations = (
  cdnSettings: CDNSettings,
  consentedCategories: Categories,
  integrationCategoryMappings: CreateWrapperSettings['integrationCategoryMappings'],
  shouldEnableIntegration: CreateWrapperSettings['shouldEnableIntegration']
): CDNSettings => {
  const { remotePlugins, integrations } = cdnSettings

  const isPluginEnabled = (creationName: string) => {
    const categories = integrationCategoryMappings
      ? // allow hardcoding of consent category mappings for testing (or other reasons)
        integrationCategoryMappings[creationName]
      : getConsentCategories(integrations[creationName])

    // allow user to customize consent logic if needed
    if (shouldEnableIntegration) {
      return shouldEnableIntegration(categories || [], consentedCategories, {
        creationName,
      })
    }

    const isMissingCategories = !categories || !categories.length

    // Enable integration by default if it contains no consent categories data (most likely because consent has not been configured).
    if (isMissingCategories) {
      return true
    }

    // Enable if all of its consent categories are consented to
    const hasUserConsent = categories.every((c) => consentedCategories[c])
    return hasUserConsent
  }

  const results = Object.keys(integrations).reduce<CDNSettings>(
    (acc, creationName) => {
      if (!isPluginEnabled(creationName)) {
        // remote disabled action destinations
        acc.remotePlugins =
          acc.remotePlugins &&
          acc.remotePlugins.filter((el) => el.creationName !== creationName)
        // remove disabled classic destinations and locally-installed action destinations
        delete acc.integrations[creationName]
      }
      return acc
    },
    {
      ...cdnSettings,
      remotePlugins,
      integrations: { ...integrations }, // make shallow copy to avoid mutating original
    }
  )
  return results
}

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
