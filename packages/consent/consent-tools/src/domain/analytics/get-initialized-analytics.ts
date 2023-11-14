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
    const globalAnalytics = (window as any)[
      opts?.globalAnalyticsKey ?? 'analytics'
    ]
    if ((globalAnalytics as any).initialized) {
      return globalAnalytics
    }
  }

  return analytics
}
