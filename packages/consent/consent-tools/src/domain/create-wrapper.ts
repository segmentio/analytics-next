import {
  Categories,
  CreateWrapper,
  AnyAnalytics,
  CDNSettingsIntegrations,
  CDNSettingsRemotePlugin,
  InitOptions,
  CreateWrapperSettings,
  CDNSettings,
} from '../types'
import { validateCategories, validateOptions } from './validation'
import { createConsentStampingMiddleware } from './consent-stamping'
import { pipe, pick, uniq } from '../utils'
import { AbortLoadError, LoadContext } from './load-cancellation'

export const createWrapper: CreateWrapper = (createWrapperOptions) => {
  validateOptions(createWrapperOptions)

  const {
    shouldDisableSegment,
    shouldDisableConsentRequirement,
    getCategories,
    shouldLoad,
    integrationCategoryMappings,
    shouldEnableIntegration,
  } = createWrapperOptions

  return (analytics) => {
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

      const cdnSettingsP = new Promise<CDNSettings>((resolve) =>
        analytics.on('initialize', resolve)
      )

      // we don't want to send _every_ category to segment, only the ones that the user has explicitly configured in their integrations
      const getFilteredSelectedCategories = async (): Promise<
        Categories | undefined
      > => {
        const cdnSettings = await cdnSettingsP
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
          return undefined
        }

        const categories = await getCategories()
        return pick(categories, allCategories)
      }

      // register listener to stamp all events with latest consent information
      analytics.addSourceMiddleware(
        createConsentStampingMiddleware(getFilteredSelectedCategories)
      )

      const updateCDNSettings: InitOptions['updateCDNSettings'] = (
        cdnSettings
      ) => {
        if (!cdnSettings.remotePlugins) {
          return cdnSettings
        }

        const remotePlugins = omitDisabledRemotePlugins(
          cdnSettings.remotePlugins,
          cdnSettings.integrations,
          initialCategories,
          integrationCategoryMappings,
          shouldEnableIntegration
        )

        return { ...cdnSettings, remotePlugins }
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

const omitDisabledRemotePlugins = (
  remotePlugins: CDNSettingsRemotePlugin[],
  integrations: CDNSettingsIntegrations,
  consentedCategories: Categories,
  integrationCategoryMappings: CreateWrapperSettings['integrationCategoryMappings'],
  shouldEnableIntegration: CreateWrapperSettings['shouldEnableIntegration']
): CDNSettingsRemotePlugin[] =>
  remotePlugins.filter((plugin) => {
    const { creationName, libraryName } = plugin
    const categories = integrationCategoryMappings
      ? // allow hardcoding of consent category mappings for testing (or other reasons)
        integrationCategoryMappings[creationName]
      : getConsentCategories(integrations[creationName])

    // allow user to customize consent logic if needed
    if (shouldEnableIntegration) {
      return shouldEnableIntegration(categories || [], consentedCategories, {
        creationName,
        libraryName,
      })
    }

    const isMissingCategories = !categories || !categories.length

    // Enable integration by default if it contains no consent categories data (most likely because consent has not been configured).
    if (isMissingCategories) {
      return true
    }

    const hasUserConsent = categories.some((c) => consentedCategories[c])
    return hasUserConsent
  })
