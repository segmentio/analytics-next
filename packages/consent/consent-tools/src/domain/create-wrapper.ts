import {
  Categories,
  CreateWrapper,
  AnyAnalytics,
  InitOptions,
  CreateWrapperSettings,
  CDNSettings,
} from '../types'
import { validateCategories, validateSettings } from './validation'
import { createConsentStampingMiddleware } from './consent-stamping'
import { pipe, pick, uniq } from '../utils'
import { AbortLoadError, LoadContext } from './load-cancellation'
import { ValidationError } from './validation/validation-error'
import { sendConsentChangedEvent } from './consent-changed'

export const createWrapper: CreateWrapper = (createWrapperOptions) => {
  validateSettings(createWrapperOptions)

  const {
    shouldDisableSegment,
    shouldDisableConsentRequirement,
    getCategories,
    shouldLoad,
    integrationCategoryMappings,
    shouldEnableIntegration,
    pruneUnmappedCategories,
    registerOnConsentChanged,
  } = createWrapperOptions

  return (analytics) => {
    assertAnalyticsInstance(analytics)
    const ogLoad = analytics.load

    const loadWithConsent: AnyAnalytics['load'] = async (
      settings,
      options
    ): Promise<void> => {
      // do not load anything -- segment included
      if (await shouldDisableSegment?.()) {
        return
      }

      const consentRequirementDisabled =
        await shouldDisableConsentRequirement?.()
      if (consentRequirementDisabled) {
        // ignore consent -- just call analytics.load as usual
        return ogLoad.call(analytics, settings, options)
      }

      // use these categories to disable/enable the appropriate device mode plugins
      let initialCategories: Categories
      try {
        initialCategories =
          (await shouldLoad?.(new LoadContext())) || (await getCategories())
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

      const getPrunedCategories = async (
        cdnSettingsP: Promise<CDNSettings>
      ): Promise<Categories> => {
        const cdnSettings = await cdnSettingsP
        // we don't want to send _every_ category to segment, only the ones that the user has explicitly configured in their integrations
        let allCategories: string[]
        // We need to get all the unique categories so we can prune the consent object down to only the categories that are configured
        // There can be categories that are not included in any integration in the integrations object (e.g. 2 cloud mode categories), which is why we need a special allCategories array
        if (integrationCategoryMappings) {
          allCategories = uniq(
            Object.values(integrationCategoryMappings).reduce((p, n) =>
              p.concat(n)
            )
          )
        } else {
          allCategories = cdnSettings.consentSettings?.allCategories || []
        }

        if (!allCategories.length) {
          // No configured integrations found, so no categories will be sent (should not happen unless there's a configuration error)
          throw new ValidationError(
            'Invariant: No consent categories defined in Segment',
            []
          )
        }

        const categories = await getCategories()

        return pick(categories, allCategories)
      }

      // create getCategories and validate them regardless of whether pruning is turned on or off
      const getValidCategoriesForConsentStamping = pipe(
        pruneUnmappedCategories
          ? getPrunedCategories.bind(
              this,
              new Promise<CDNSettings>((resolve) =>
                analytics.on('initialize', resolve)
              )
            )
          : getCategories,
        async (categories) => {
          validateCategories(await categories)
          return categories
        }
      ) as () => Promise<Categories>

      // register listener to stamp all events with latest consent information
      analytics.addSourceMiddleware(
        createConsentStampingMiddleware(getValidCategoriesForConsentStamping)
      )

      if (registerOnConsentChanged) {
        // whenever consent changes, dispatch a new event with the latest consent information
        registerOnConsentChanged((categories) => {
          try {
            validateCategories(categories)
            sendConsentChangedEvent(analytics, categories)
          } catch (err) {
            // Not sure if there's a better way to handle this, but this makes testing a bit easier.
            console.error(err)
          }
        })
      }

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
          options?.updateCDNSettings ? options.updateCDNSettings : (f) => f
        ),
      })
    }
    analytics.load = loadWithConsent
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

function assertAnalyticsInstance(
  analytics: unknown
): asserts analytics is AnyAnalytics {
  if (
    analytics &&
    typeof analytics === 'object' &&
    'load' in analytics &&
    'on' in analytics &&
    'addSourceMiddleware' in analytics
  ) {
    return
  }
  throw new Error('analytics is not an Analytics instance')
}
