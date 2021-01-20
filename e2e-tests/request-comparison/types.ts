export interface JSONRequests {
  name: string
  trackingAPI: TrackingAPI[]
}

export interface TrackingAPI {
  method: string
  url: string
  postData: PostData
  headers: {
    referer: string
    'content-type': string
    'user-agent'?: string
    origin?: string
    accept?: string
  }
}

interface PostData {
  integrations: object
  anonymousId: string
  type: string
  properties?: Properties
  name?: string
  context: Context
  messageId: string
  timestamp?: string
  writeKey: string
  userId?: string
  sentAt?: string
  traits?: Traits
  category?: string
  _metadata?: Metadata
}

interface Metadata {
  bundled: string[]
  unbundled: string[]
  failedInitializations?: string[]
}

interface Context {
  [x: string]: any
  attempts?: number
  metrics?: object[]
  userAgent: string
  locale: string
  library?: Library
  page?: Properties
  externalIds?: ExternalID[]
  traits?: Traits
}

interface ExternalID {
  id: string
  type: string
  collection: string
  encoding: string
}

interface Library {
  name: string
  version?: string
}

interface Properties {
  [x: string]: any
  path: string
  referrer: string
  search: string
  title: string
  url: string
}

interface Traits {
  crossDomainId: string
}
