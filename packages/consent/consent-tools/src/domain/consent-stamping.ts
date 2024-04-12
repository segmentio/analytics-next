import { Categories, SourceMiddlewareFunction } from '../types'
import { validateCategories } from './validation'

type CreateConsentMw = (
  getCategories: () => Promise<Categories>
) => SourceMiddlewareFunction

/**
 * Create analytics addSourceMiddleware fn that stamps each event
 */
export const createConsentStampingMiddleware: CreateConsentMw = (
  getCategories
) => {
  const fn: SourceMiddlewareFunction = async ({ payload, next }) => {
    const categories = await getCategories()

    validateCategories(categories)
    payload.obj.context.consent = {
      ...payload.obj.context.consent,
      categoryPreferences: categories,
    }

    next(payload)
  }
  return fn
}
