import { pick } from '../utils'
import { Categories } from '../types'
import { ValidationError } from './validation/validation-error'

export const getPrunedCategories = (
  categories: Categories,
  allCategories: string[]
): Categories => {
  if (!allCategories.length) {
    // No configured integrations found, so no categories will be sent (should not happen unless there's a configuration error)
    throw new ValidationError(
      'Invariant: No consent categories defined in Segment',
      []
    )
  }

  return pick(categories, allCategories)
}
