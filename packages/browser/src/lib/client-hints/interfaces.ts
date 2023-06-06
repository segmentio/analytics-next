// https://wicg.github.io/ua-client-hints/#dictdef-navigatoruabrandversion
export interface NavigatorUABrandVersion {
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
  getHighEntropyValues(hints: HighEntropyHint[]): Promise<UADataValues>
  toJSON(): UALowEntropyJSON
}

export type HighEntropyHint =
  | 'architecture'
  | 'bitness'
  | 'model'
  | 'platformVersion'
  | 'uaFullVersion'
  | 'fullVersionList'
  | 'wow64'
