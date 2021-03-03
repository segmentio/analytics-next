export interface JSONRequests {
  cookies: Cookie[]
  integrations: string[]
  networkRequests: NetworkRequest[]
}

export interface NetworkRequest {
  url: string
  postData: PostData
  headers: {
    referer?: string
    'content-type'?: string
    'user-agent'?: string
    origin?: string
    accept?: string
  }
}

export interface Cookie {
  sameSite: string
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
}

interface PostData {
  integrations: object
  anonymousId?: string
  type: string
  properties?: Properties
  name?: string
  context: Context
  messageId?: string
  timestamp?: string
  writeKey?: string
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
  bundledConfigIds?: string[]
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
