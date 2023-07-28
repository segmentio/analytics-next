import { AnalyticsSnippet } from './standalone-interface'

/**
 * Gets the global analytics instance/buffer
 * @param key name of the window property where the buffer is stored (default: analytics)
 * @returns AnalyticsSnippet
 */
export function getGlobalAnalytics(
  key = 'analytics'
): AnalyticsSnippet | undefined {
  return (window as any)[key]
}
