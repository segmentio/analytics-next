/**
 * Defining stub interface here because we don't want to introduce a prod dependency on the analytics-next package
 * Otherwise, we would introduce typescript errors for library consumers (unless they do skipLibCheck: true).
 */

export type EdgeFnCDNSettings = {
  version: number
  downloadURL: string
}

export type AutoInstrumentationCDNSettings = {
  sampleRate: number
}

export interface CDNSettings {
  integrations: CDNSettingsIntegrations
  edgeFunction?: EdgeFnCDNSettings | { [key: string]: never }
  autoInstrumentationSettings?: AutoInstrumentationCDNSettings
}

export interface SegmentEventStub {
  type: string
  context: {
    __eventOrigin?: {
      type: 'Signal'
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface SourceMiddlewareParams {
  payload: {
    obj: SegmentEventStub
  }
  next: (payload: SourceMiddlewareParams['payload'] | null) => void
}

export type SourceMiddlewareFunction = (
  middleware: SourceMiddlewareParams
) => null | void | Promise<void | null>

export interface DestinationMiddlewareParams {
  payload: SourceMiddlewareParams['payload']
  next: SourceMiddlewareParams['next']
  /**
   * integration name
   * @example "Amplitude (Actions)"
   */
  integration: string
}

export interface AnyAnalytics {
  settings: {
    cdnSettings: CDNSettings
    writeKey: string
    cdnURL?: string //  temporarily optional because analytics does not have this API yet
    apiHost?: string //  temporarily optional because analytics does not have this API yet
  }
  addSourceMiddleware(
    middleware: Function | SourceMiddlewareFunction
  ): any | this
  track(event: string, properties?: unknown, ...args: any[]): void
  identify(...args: any[]): void
  page(...args: any[]): void
  group(...args: any[]): void
  alias(...args: any[]): void
  screen(...args: any[]): void
  reset(): void
  on(name: 'reset', fn: (...args: any[]) => void): void
}

/**
 *CDN Settings Integrations object.
 * @example
 * { "Fullstory": {...}, "Braze Web Mode (Actions)": {...}}
 */
export interface CDNSettingsIntegrations {
  [integrationName: string]: { [key: string]: any }
}

export type PluginType = 'before' | 'after' | 'destination'

export interface Plugin<Analytics = AnyAnalytics, Ctx = Record<string, any>> {
  name: string
  type: PluginType
  isLoaded: () => boolean
  load: (ctx: Ctx, instance: Analytics) => Promise<unknown>

  unload?: (ctx: Ctx, instance: Analytics) => Promise<unknown> | unknown
  ready?: () => Promise<unknown>
  track?: (ctx: Ctx) => Promise<Ctx> | Ctx
  identify?: (ctx: Ctx) => Promise<Ctx> | Ctx
  page?: (ctx: Ctx) => Promise<Ctx> | Ctx
  group?: (ctx: Ctx) => Promise<Ctx> | Ctx
  alias?: (ctx: Ctx) => Promise<Ctx> | Ctx
  screen?: (ctx: Ctx) => Promise<Ctx> | Ctx
}
