import { AnalyticsSnippet } from '../browser/standalone-interface'

/**
 * Stores the global window analytics key
 */
let _globalAnalyticsKey = 'analytics'

/**
 * Gets the global analytics/buffer
 * @param key name of the window property where the buffer is stored (default: analytics)
 * @returns AnalyticsSnippet
 */
export function getGlobalAnalytics(): AnalyticsSnippet | undefined {
  return (window as any)[_globalAnalyticsKey]
}

/**
 * Replaces the global window key for the analytics/buffer object
 * @param key key name
 */
export function setGlobalAnalyticsKey(key: string) {
  _globalAnalyticsKey = key
}

/**
 * Sets the global analytics object
 * @param analytics analytics snippet
 */
export function setGlobalAnalytics(analytics: AnalyticsSnippet): void {
  ;(window as any)[_globalAnalyticsKey] = analytics
}
