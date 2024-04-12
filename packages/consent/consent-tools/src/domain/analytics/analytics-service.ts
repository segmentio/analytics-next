import { createDeferred } from '@segment/analytics-generic-utils'
import {
  AnyAnalytics,
  Categories,
  CDNSettings,
  CreateWrapperSettings,
  GetCategoriesFunction,
  IntegrationCategoryMappings,
  MaybeInitializedAnalytics,
} from '../../types'
import { pipe } from '../../utils'
import { addBlockingMiddleware } from '../blocking-middleware'
import { createConsentStampingMiddleware } from '../consent-stamping'
import { parseAllCategories, getPrunedCategories } from '../pruned-categories'
import { validateAnalyticsInstance, validateCategories } from '../validation'
import { logger } from '../logger'

export interface AnalyticsServiceOptions {
  getCategories: GetCategoriesFunction
  pruneUnmappedCategories?: boolean
  integrationCategoryMappings?: IntegrationCategoryMappings
  shouldEnableIntegration?: CreateWrapperSettings['shouldEnableIntegration']
}
/**
 * This class is a wrapper around the analytics.js library.
 */
export class AnalyticsService {
  private options: AnalyticsServiceOptions

  private cdnSettingsDeferred = createDeferred<CDNSettings>()

  private ogAnalyticsLoad: AnyAnalytics['load']

  private get analytics() {
    return getInitializedAnalytics(this.uninitializedAnalytics)
  }

  private get cdnSettings(): Promise<CDNSettings> {
    return this.cdnSettingsDeferred.promise
  }

  private async getAllCategories(): Promise<string[]> {
    const allCategories = this.options.integrationCategoryMappings
      ? parseAllCategories(this.options.integrationCategoryMappings)
      : (await this.cdnSettings).consentSettings?.allCategories

    return allCategories ?? []
  }

  private uninitializedAnalytics: AnyAnalytics

  constructor(analytics: AnyAnalytics, options: AnalyticsServiceOptions) {
    validateAnalyticsInstance(analytics)
    this.options = options
    this.uninitializedAnalytics = analytics

    // store the raw analytics load instance, because we may replace it later
    this.ogAnalyticsLoad = analytics.load.bind(this.uninitializedAnalytics)
  }

  /**
   * The orignal analytics load function, but also stores the CDN settings on the instance.
   */
  load(
    ...[settings, options]: Parameters<AnyAnalytics['load']>
  ): ReturnType<AnyAnalytics['load']> {
    return this.ogAnalyticsLoad(settings, {
      ...options,
      updateCDNSettings: pipe(
        options?.updateCDNSettings || ((id) => id),
        (cdnSettings) => {
          logger.debug('CDN settings loaded', cdnSettings)
          // extract the CDN settings from this call and store it on the instance.
          // there is an 'initialize' event emitter, but it's called too late for our purposes.
          this.cdnSettingsDeferred.resolve(cdnSettings)
          return cdnSettings
        }
      ),
    })
  }

  /**
   * Replace the load fn with a new one
   */
  replaceLoadMethod(loadFn: AnyAnalytics['load']) {
    this.analytics.load = loadFn
  }

  page(): void {
    this.analytics.page()
  }

  configureBlockingMiddlewareForOptOut(): void {
    addBlockingMiddleware(this.cdnSettings, this.analytics, {
      integrationCategoryMappings: this.options.integrationCategoryMappings,
      shouldEnableIntegration: this.options.shouldEnableIntegration,
    })
  }

  configureConsentStampingMiddleware(): void {
    const { getCategories, pruneUnmappedCategories } = this.options
    // normalize getCategories pruning is turned on or off
    const getCategoriesForConsentStamping = async (): Promise<Categories> => {
      const categories = await getCategories()
      if (pruneUnmappedCategories) {
        return getPrunedCategories(categories, await this.getAllCategories())
      }
      return categories
    }

    const MW = createConsentStampingMiddleware(getCategoriesForConsentStamping)
    this.analytics.addSourceMiddleware(MW)
  }

  /**
   * Dispatch an event that looks like:
   * ```ts
   * {
   * "type": "track",
   *  "event": "Segment Consent Preference",
   *  "context": {
   *    "consent": {
   *      "categoryPreferences" : {
   *         "C0001": true,
   *         "C0002": false,
   *    }
   *  }
   * ...
   * ```
   */
  consentChange(categories: Categories): void {
    try {
      validateCategories(categories)
    } catch (e: unknown) {
      // not sure if there's a better way to handle this
      return console.error(e)
    }
    const CONSENT_CHANGED_EVENT = 'Segment Consent Preference'
    this.analytics.track(CONSENT_CHANGED_EVENT, undefined, {
      consent: { categoryPreferences: categories },
    })
  }
}

/**
 * Get possibly-initialized analytics.
 *
 * Reason:
 * There is a known bug for people who attempt to to wrap the library: the analytics reference does not get updated when the analytics.js library loads.
 * Thus, we need to proxy events to the global reference instead.
 *
 * There is a universal fix here: however, many users may not have updated it:
 * https://github.com/segmentio/snippet/commit/081faba8abab0b2c3ec840b685c4ff6d6cccf79c
 */
export const getInitializedAnalytics = (
  analytics: AnyAnalytics
): MaybeInitializedAnalytics => {
  const isSnippetUser = Array.isArray(analytics)
  if (isSnippetUser) {
    const opts = (analytics as any)._loadOptions ?? {}
    const globalAnalytics: MaybeInitializedAnalytics | undefined = (
      window as any
    )[opts?.globalAnalyticsKey ?? 'analytics']
    // we could probably skip this check and always return globalAnalytics, since they _should_ be set to the same thing at this point
    // however, it is safer to keep buffering.
    if ((globalAnalytics as any)?.initialized) {
      return globalAnalytics!
    }
  }

  return analytics
}
