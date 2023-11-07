import { uniq, pick } from '../utils'
import {
  CDNSettings,
  CreateWrapperSettings,
  Categories,
  GetCategoriesFunction,
} from '../types'
import { ValidationError } from './validation/validation-error'

export const getPrunedCategories = async (
  getCategories: GetCategoriesFunction,
  cdnSettings: CDNSettings,
  integrationCategoryMappings?: CreateWrapperSettings['integrationCategoryMappings']
): Promise<Categories> => {
  // we don't want to send _every_ category to segment, only the ones that the user has explicitly configured in their integrations
  let allCategories: string[]
  // We need to get all the unique categories so we can prune the consent object down to only the categories that are configured
  // There can be categories that are not included in any integration in the integrations object (e.g. 2 cloud mode categories), which is why we need a special allCategories array
  if (integrationCategoryMappings) {
    allCategories = uniq(
      Object.values(integrationCategoryMappings).reduce((p, n) => p.concat(n))
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
