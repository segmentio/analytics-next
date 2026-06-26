import type { AnalyticsInitConfig } from './types'
import { ConversionAnalyticsBrowser } from './conversion-analytics-browser'
import { resolveInitConfig } from './write-key-config'
import { getCurrentSessionId } from '../plugins/conversion-collector/lib/session'

type StubQueuedCall = { type: string; arguments: unknown[] }
type StubAnalytics = {
  queue?: StubQueuedCall[]
  config?: Partial<AnalyticsInitConfig>
  writeKey?: string
}

const STUB_GLOBALS = [
  'analytics',
  '_analytics',
  'ConversionAnalytics',
  '_ConversionAnalytics',
] as const

const PREFERRED_STUB_GLOBALS = [
  'ConversionAnalytics',
  '_ConversionAnalytics',
  'analytics',
  '_analytics',
] as const

function isConfiguredStub(candidate: unknown): candidate is StubAnalytics {
  return (
    candidate != null &&
    typeof candidate === 'object' &&
    ('config' in candidate || 'queue' in candidate || 'writeKey' in candidate)
  )
}

function resolveStub(w: Record<string, unknown>): StubAnalytics | undefined {
  for (const key of PREFERRED_STUB_GLOBALS) {
    const candidate = w[key]
    if (isConfiguredStub(candidate)) {
      return candidate
    }
  }

  for (const key of STUB_GLOBALS) {
    const candidate = w[key]
    if (candidate && typeof candidate === 'object') {
      return candidate as StubAnalytics
    }
  }
  return undefined
}

function hydrateStub(
  stub: StubAnalytics & Record<string, unknown>,
  api: Record<string, unknown>
): void {
  Object.assign(stub, {
    instance: api.instance,
    init: api.init,
    track: api.track,
    identify: api.identify,
    page: api.page,
    config: api.config,
    writeKey: api.writeKey,
    version: api.version,
    loaded: api.loaded,
  })
  // Object.assign would snapshot a getter as a plain string — keep live read-only access.
  Object.defineProperty(stub, '_sessionId', {
    get: () => getCurrentSessionId(),
    configurable: true,
    enumerable: true,
  })
}

function attachGlobals(
  w: Record<string, unknown>,
  api: Record<string, unknown>,
  globalName: string
): void {
  w[globalName] = api
  if (globalName !== 'analytics') {
    w.analytics = api
  }
  w._analytics = api
  w.ConversionAnalytics = api
  w._ConversionAnalytics = api
}

function toBootstrapConfig(
  stub: StubAnalytics | undefined
): AnalyticsInitConfig {
  if (stub?.writeKey) {
    return resolveInitConfig(stub.writeKey, stub.config)
  }
  if (stub?.config?.writeKey) {
    return resolveInitConfig(stub.config.writeKey, stub.config)
  }
  return resolveInitConfig(stub?.config ?? {})
}

export async function bootstrapConversionAnalyticsFromWindow(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const w = window as unknown as Record<string, unknown>
  const stub = resolveStub(w)
  const config = toBootstrapConfig(stub)

  const analytics = await ConversionAnalyticsBrowser.load(config)

  const api = {
    instance: analytics,
    init: (
      writeKeyOrConfig: string | AnalyticsInitConfig,
      options?: Partial<AnalyticsInitConfig>
    ) => analytics.init(writeKeyOrConfig, options),
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
    config,
    writeKey: config.writeKey,
    version: '1.0',
    loaded: true,
    get _sessionId() {
      return getCurrentSessionId()
    },
  }

  const globalName = config.globalName ?? 'analytics'
  const apiRecord = api as unknown as Record<string, unknown>
  const queuedSnapshot = stub?.queue?.length ? stub.queue.slice() : []

  if (stub != null) {
    hydrateStub(stub as StubAnalytics & Record<string, unknown>, apiRecord)
    w[globalName] = stub
    if (globalName !== 'analytics') {
      w.analytics = stub
    }
    w._analytics = stub
    w.ConversionAnalytics = stub
    w._ConversionAnalytics = stub
  } else {
    attachGlobals(w, apiRecord, globalName)
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
      }
      // init is intentionally not replayed: bootstrap already applied stub config and
      // re-init would not rebind the hydrated stub methods/globals.
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
