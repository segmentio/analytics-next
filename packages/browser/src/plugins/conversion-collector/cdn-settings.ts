import { CDNSettings } from '../../browser/settings'

/**
 * Minimal CDN settings for npm-only loads without calling the Segment CDN.
 * Pair with `integrations: { 'Segment.io': false }` and a custom collector plugin.
 */
export const conversionCdnSettingsMinimal: CDNSettings = {
  integrations: {},
}
