import { Categories, SourceMiddlewareFunction } from '../types'

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
    payload.obj.context.consent = {
      ...payload.obj.context.consent,
      categoryPreferences: await getCategories(),
    }

    next(payload)
  }
  return fn
}
