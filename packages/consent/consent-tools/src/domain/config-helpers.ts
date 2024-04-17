import { IntegrationCategoryMappings } from '../types'
import { uniq } from '../utils'

/**
 * Parse list of categories from `cdnSettings.integration.myIntegration` object
 * @example
 * returns ["Analytics", "Advertising"]
 */
export const parseConsentCategories = (
  integration: unknown
): string[] | undefined => {
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

export const parseAllCategories = (
  integrationCategoryMappings: IntegrationCategoryMappings
) => {
  return uniq(
    Object.values(integrationCategoryMappings).reduce((p, n) => p.concat(n))
  )
}
