import { AnyAnalytics, MaybeInitializedAnalytics } from '../../types'

/**
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
    // however, we _never_ want to call methods on an uninitialized analytics instance. Better to keep buffering.
    if ((globalAnalytics as any)?.initialized) {
      return globalAnalytics!
    }
  }

  return analytics
}
