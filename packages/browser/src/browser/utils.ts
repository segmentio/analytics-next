import { AnalyticsSnippet } from './standalone-interface'

/**
 * Stores the global window analytics key
 */
let _globalAnalyticsKey = 'analytics'

/**
 * Gets the global analytics instance/buffer
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
