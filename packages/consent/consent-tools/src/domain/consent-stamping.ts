import { AnyAnalytics, Categories } from '../types'

type CreateConsentMw = (
  getCategories: () => Promise<Categories>
) => AnyAnalytics['addSourceMiddleware']

/**
 * Create analytics addSourceMiddleware fn that stamps each event
 */
export const createConsentStampingMiddleware: CreateConsentMw =
  (getCategories) =>
  async ({ payload, next }) => {
    const categories = await getCategories()
    payload.obj.context.consent = {
      ...payload.obj.context.consent,
      categoryPreferences: categories,
    }
    next(payload)
  }
