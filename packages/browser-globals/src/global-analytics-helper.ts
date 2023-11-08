const getGlobalAnalyticsKey = (): string => {
  return (window as any)._globalAnalyticsKey || 'analytics'
}

/**
 * Replaces the global window key for the analytics/buffer object
 * @param key key name
 */
export function setGlobalAnalyticsKey(key: string) {
  ;(window as any)._globalAnalyticsKey = key
}

/**
 * Gets the global analytics/buffer
 * @param key name of the window property where the buffer is stored (default: analytics)
 * @returns AnalyticsSnippet
 */
export function getGlobalAnalytics<AnalyticsSnippet = any>():
  | AnalyticsSnippet
  | undefined {
  return (window as any)[getGlobalAnalyticsKey()]
}

/**
 * Sets the global analytics object
 * @param analytics analytics snippet
 */
export function setGlobalAnalytics(analytics: any): void {
  ;(window as any)[getGlobalAnalyticsKey()] = analytics
}
