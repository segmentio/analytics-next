export * from './core/analytics'
export * from './browser'
export * from './node'

export * from './core/context'
export * from './core/events'
export * from './core/plugin'
export * from './core/user'

export type { AnalyticsSnippet } from './browser/standalone-interface'
export type { MiddlewareFunction } from './plugins/middleware'
export { getGlobalAnalytics } from './lib/global-analytics-helper'
export { UniversalStorage, Store, StorageObject } from './core/storage'

// helpful for analytics-node users who may not use the analytics.js SDK, but want help with populating their context.
export { getDefaultPageContext, type PageContext } from './core/page'
