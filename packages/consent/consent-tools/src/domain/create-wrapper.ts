import {
  Categories,
  CreateWrapper,
  AnyAnalytics,
  InitOptions,
  CreateWrapperSettings,
  CDNSettings,
} from '../types'
import {
  validateAnalyticsInstance,
  validateCategories,
  validateSettings,
} from './validation'
import { createConsentStampingMiddleware } from './consent-stamping'
import { pipe } from '../utils'
import { AbortLoadError, LoadContext } from './load-cancellation'
import { validateAndSendConsentChangedEvent } from './consent-changed'
import { getPrunedCategories } from './pruned-categories'

export const createWrapper = <Analytics extends AnyAnalytics>(
  ...[createWrapperOptions]: Parameters<CreateWrapper<Analytics>>
): ReturnType<CreateWrapper<Analytics>> => {
  validateSettings(createWrapperOptions)

  const {
    shouldDisableSegment,
    getCategories,
    shouldLoadSegment,
    integrationCategoryMappings,
    shouldEnableIntegration,
    pruneUnmappedCategories,
    registerOnConsentChanged,
    shouldLoadWrapper,
  } = createWrapperOptions

  return (analytics: Analytics) => {
    validateAnalyticsInstance(analytics)
    const loadWrapper = shouldLoadWrapper?.() || Promise.resolve()
    void loadWrapper.then(() => {
      // Call this function as early as possible. OnConsentChanged events can happen before .load is called.
      registerOnConsentChanged?.((categories) =>
        // whenever consent changes, dispatch a new event with the latest consent information
        validateAndSendConsentChangedEvent(analytics, categories)
      )
    })

    const ogLoad = analytics.load

    const loadWithConsent: AnyAnalytics['load'] = async (
      settings,
      options
    ): Promise<void> => {
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
            ogLoad.call(analytics, settings, options)
          }
          // do not load anything, but do not log anything either
          // if someone calls ctx.abort(), they are handling the error themselves
          return
        } else {
          throw e
        }
      }

      validateCategories(initialCategories)

      // we need to register the listener before .load is called so we don't miss it.
      // note: the 'initialize' API event is emitted so before the final flushing of events, so this promise won't block the pipeline.
      const cdnSettings = new Promise<CDNSettings>((resolve) =>
        analytics.on('initialize', resolve)
      )

      // normalize getCategories pruning is turned on or off
      const getCategoriesForConsentStamping = async (): Promise<Categories> => {
        if (pruneUnmappedCategories) {
          return getPrunedCategories(
            getCategories,
            await cdnSettings,
            integrationCategoryMappings
          )
        } else {
          return getCategories()
        }
      }

      // register listener to stamp all events with latest consent information
      analytics.addSourceMiddleware(
        createConsentStampingMiddleware(getCategoriesForConsentStamping)
      )

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

      return ogLoad.call(analytics, settings, {
        ...options,
        updateCDNSettings: pipe(
          updateCDNSettings,
          options?.updateCDNSettings || ((id) => id)
        ),
      })
    }
    analytics.load = loadWithConsent
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
