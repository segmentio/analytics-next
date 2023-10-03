export { Analytics } from './app/analytics-node'
export { Context } from './app/context'
export {
  HTTPClient,
  FetchHTTPClient,
  HTTPFetchRequest,
  HTTPResponse,
  HTTPFetchFn,
  HTTPClientRequest,
} from './lib/http-client'

export type {
  Plugin,
  GroupTraits,
  UserTraits,
  TrackParams,
  IdentifyParams,
  AliasParams,
  GroupParams,
  PageParams,
} from './app/types'
export type { AnalyticsSettings } from './app/settings'

// export Analytics as both a named export and a default export (for backwards-compat. reasons)
import { Analytics } from './app/analytics-node'
export default Analytics

import { dependencyInjection } from './lib/dependency-injection'
import { TokenManager } from './lib/token-manager'
dependencyInjection.registerDependency('TokenManager', TokenManager)
