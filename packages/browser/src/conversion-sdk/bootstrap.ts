import type { AnalyticsInitConfig } from './types'
import { ConversionAnalyticsBrowser } from './conversion-analytics-browser'

type StubQueuedCall = { type: string; arguments: unknown[] }
type StubAnalytics = {
  queue?: StubQueuedCall[]
  config?: Partial<AnalyticsInitConfig>
}

/** Snippet stub lives here so `window.Analytics` stays free for other tools. */
function resolveStub(w: Record<string, unknown>): StubAnalytics | undefined {
  return (w._ConversionAnalytics ?? w.ConversionAnalytics) as
    | StubAnalytics
    | undefined
}

function hydrateStub(
  stub: StubAnalytics & Record<string, unknown>,
  api: Record<string, unknown>
): void {
  Object.assign(stub, {
    instance: api.instance,
    init: api.init,
    start: api.start,
    stop: api.stop,
    flush: api.flush,
    track: api.track,
    identify: api.identify,
    page: api.page,
    getDebugInfo: api.getDebugInfo,
    getQueueSize: api.getQueueSize,
    config: api.config,
    version: api.version,
    loaded: api.loaded,
  })
}

function attachGlobal(
  w: Record<string, unknown>,
  api: Record<string, unknown>
): void {
  w.ConversionAnalytics = api
  w._ConversionAnalytics = api
}

function toConfig(stub: StubAnalytics | undefined): AnalyticsInitConfig {
  const cfg = stub?.config ?? {}
  return {
    endpoint: cfg.endpoint,
    appName: cfg.appName,
    debug: cfg.debug,
    flushIntervalMs: cfg.flushIntervalMs,
    batchSize: cfg.batchSize,
    retryAttempts: cfg.retryAttempts,
    headers: cfg.headers,
    getContext: cfg.getContext,
    getSessionId: cfg.getSessionId,
    getVisitorCountry: cfg.getVisitorCountry,
    isTrackingAllowed: cfg.isTrackingAllowed,
    respectDoNotTrack: cfg.respectDoNotTrack,
    onError: cfg.onError,
    defaultPhoneCountryCode: cfg.defaultPhoneCountryCode,
    enableGptSlotEvents: cfg.enableGptSlotEvents,
  }
}

export async function bootstrapConversionAnalyticsFromWindow(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const w = window as unknown as Record<string, unknown>
  const stub = resolveStub(w)
  const config = toConfig(stub)

  const analytics = await ConversionAnalyticsBrowser.load(config)

  const api = {
    instance: analytics,
    init: (next: AnalyticsInitConfig) => analytics.init(next),
    start: () => analytics.start(),
    stop: () => analytics.stop(),
    flush: () => analytics.flush(),
    track: (event: unknown, payload?: unknown, options?: unknown) =>
      analytics.track(event as never, payload as never, options as never),
    identify: (user: unknown, traits?: unknown, options?: unknown) =>
      analytics.identify(user as never, traits as never, options as never),
    page: (name?: unknown, properties?: unknown, options?: unknown) => {
      const props =
        typeof name === 'string'
          ? {
              name,
              ...(typeof properties === 'object' && properties
                ? (properties as object)
                : {}),
            }
          : typeof name === 'object' && name
          ? (name as object)
          : typeof properties === 'object' && properties
          ? (properties as object)
          : {}

      return analytics.page(props as Record<string, unknown>, options as never)
    },
    getDebugInfo: () => analytics.getDebugInfo(),
    getQueueSize: () => analytics.getQueueSize(),
    config,
    version: '1.0',
    loaded: true,
  }

  const apiRecord = api as unknown as Record<string, unknown>
  const queuedSnapshot = stub?.queue?.length ? stub.queue.slice() : []

  if (stub != null) {
    hydrateStub(stub as StubAnalytics & Record<string, unknown>, apiRecord)
    w.ConversionAnalytics = stub
    w._ConversionAnalytics = stub
  } else {
    attachGlobal(w, apiRecord)
  }

  for (const call of queuedSnapshot) {
    try {
      if (call.type === 'track') {
        await api.track(call.arguments[0], call.arguments[1], call.arguments[2])
      } else if (call.type === 'identify') {
        await api.identify(
          call.arguments[0],
          call.arguments[1],
          call.arguments[2]
        )
      } else if (call.type === 'page') {
        await api.page(call.arguments[0], call.arguments[1], call.arguments[2])
      } else if (call.type === 'init') {
        const arg0 = call.arguments[0]
        if (arg0 && typeof arg0 === 'object') {
          api.init(arg0 as AnalyticsInitConfig)
        }
      } else if (call.type === 'flush') {
        await api.flush()
      }
    } catch (error) {
      config.onError?.(error)
    }
  }

  const hostQueuedPage = queuedSnapshot.some((call) => call.type === 'page')
  if (!hostQueuedPage) {
    try {
      await api.page()
    } catch (error) {
      config.onError?.(error)
    }
  }
}
