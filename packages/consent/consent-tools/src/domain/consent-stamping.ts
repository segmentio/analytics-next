import { AnyAnalytics, Categories } from '../types'

type CreateConsentMw = (
  getCategories: () => Promise<Categories | undefined>
) => AnyAnalytics['addSourceMiddleware']

/**
 * Create analytics addSourceMiddleware fn that stamps each event
 */
export const createConsentStampingMiddleware: CreateConsentMw =
  (getCategories) =>
  async ({ payload, next }) => {
    const categories = await getCategories()
    if (!categories) {
      console.error('Skipping consent stamping because categories are empty')
      return next(payload)
    }
    payload.obj.context.consent = {
      ...payload.obj.context.consent,
      categoryPreferences: await getCategories(),
    }
    next(payload)
  }
