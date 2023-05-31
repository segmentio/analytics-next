// https://wicg.github.io/ua-client-hints/#dictdef-navigatoruabrandversion
interface NavigatorUABrandVersion {
  readonly brand: string
  readonly version: string
}

// https://wicg.github.io/ua-client-hints/#dictdef-uadatavalues
export interface UADataValues {
  readonly brands?: NavigatorUABrandVersion[]
  readonly mobile?: boolean
  readonly platform?: string
  readonly architecture?: string
  readonly bitness?: string
  readonly model?: string
  readonly platformVersion?: string
  /** @deprecated in favour of fullVersionList */
  readonly uaFullVersion?: string
  readonly fullVersionList?: NavigatorUABrandVersion[]
  readonly wow64?: boolean
}

// https://wicg.github.io/ua-client-hints/#dictdef-ualowentropyjson
export interface UALowEntropyJSON {
  readonly brands: NavigatorUABrandVersion[]
  readonly mobile: boolean
  readonly platform: string
}

// https://wicg.github.io/ua-client-hints/#navigatoruadata
export interface NavigatorUAData extends UALowEntropyJSON {
  getHighEntropyValues(hints: string[]): Promise<UADataValues>
  toJSON(): UALowEntropyJSON
}

/**
 * Array of high entropy Client Hints to request. These may be rejected by the user agent - only required hints should be requested.
 * @return {Object} Object containing low entropy hints and successfully resolved high entropy hints
 */
export type HighEntropyHint =
  | 'architecture'
  | 'bitness'
  | 'model'
  | 'platformVersion'
  | 'uaFullVersion'
  | 'fullVersionList'
