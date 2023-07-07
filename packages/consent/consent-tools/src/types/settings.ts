import { LoadContext } from '../domain/load-cancellation'
import type {
  Categories,
  IntegrationCategoryMappings,
  CDNSettingsRemotePlugin,
} from './wrapper'

/**
 * Consent wrapper function configuration
 */
export interface CreateWrapperSettings {
  /**
   * Wait until this function resolves/returns before loading analytics.
   * This function should return a list of initial categories.
   * If this function returns `undefined`, `getCategories()` function will be called to get initial categories.
   **/
  shouldLoad?: (
    context: LoadContext
  ) => Categories | void | Promise<Categories | void>

  /**
   * Fetch the categories which stamp every event. Called each time a new Segment event is dispatched.
   * @example
   * ```ts
   * () => ({ "Advertising": true, "Analytics": false })
   * ```
   **/
  getCategories: () => Categories | Promise<Categories>

  /**
   * This permanently disables any consent requirement (i.e device mode gating, event pref stamping).
   * Called on wrapper initialization. **shouldLoad will never be called**
   **/
  shouldDisableConsentRequirement?: () => boolean | Promise<boolean>

  /**
   * Disable the Segment analytics SDK completely. analytics.load() will have no effect.
   * .track / .identify etc calls should not throw any errors, but analytics settings will never be fetched and no events will be sent to Segment.
   * Called on wrapper initialization. This can be useful in dev environments (e.g. 'devMode').
   * **shouldLoad will never be called**
   **/
  shouldDisableSegment?: () => boolean | Promise<boolean>

  /**
   * A callback that should be passed to onConsentChanged. This is neccessary for sending automatic "consent changed" events to segment (Future behavior)
   **/
  registerConsentChanged?: (callback: (categories: Categories) => void) => void

  /**
   * Object that maps `integrationName -> categories`. Typically, this is not needed, as this data comes from the CDN and is attached to each integration.
   * However, it may be desirable to hardcode these mappings (e.g, for testing).
   * @example
   * {"Braze Web Mode (Actions)": ["Advertising", "Analytics"]
   */
  integrationCategoryMappings?: IntegrationCategoryMappings

  /**
   * Predicate function to override default logic around whether or not to load an integration.
   * @default
   * ```ts
   * // consent if user consents to at least one category defined in the integration
   * (categories, consentedCategories, _info) => {
   *    if (!categories.length) return true
   *    return categories.some((c) => consentedCategories[c])
   * }
   * ```
   *
   * @example -
   * ```ts
   * (categories, consentedCategories, _info) => {
   * // consent if user consents to _all_ categories defined in the integration
   *    if (!categories.length) return true
   *    return categories.every((c) => consentedCategories[c])
   * }
   * ```
   *
   * @example
   * ```ts
   * // count consent as usual, but always disable a particular plugin
   * (categories, consentedCategories, { creationName }) => {
   *    if (creationName === 'FullStory') return false
   *    if (!categories.length) return true
   *    return categories.some((c) => consentedCategories[c])
   * }
   * ```
   */
  shouldEnableIntegration?: (
    integrationCategories: string[],
    userConsentedCategories: Categories,
    integrationInfo: Pick<
      CDNSettingsRemotePlugin,
      'creationName' | 'libraryName'
    >
  ) => boolean
}
