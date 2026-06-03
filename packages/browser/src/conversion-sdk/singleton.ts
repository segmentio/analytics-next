import type {
  AnalyticsInitConfig,
  IdentifyLegacyInput,
  IdentifyOptions,
  TrackLegacyInput,
  TrackOptions,
} from './types'
import { ConversionClient } from './conversion-client'

let singleton = new ConversionClient()

export function getAnalyticsSingleton(): ConversionClient {
  return singleton
}

export function resetAnalyticsSingleton(config?: AnalyticsInitConfig): void {
  singleton = new ConversionClient()
  if (config) {
    singleton.init(config)
  }
}

export function init(config: AnalyticsInitConfig): void {
  singleton.init(config)
}

export function start(): void {
  singleton.start()
}

export async function stop(): Promise<void> {
  await singleton.stop()
}

export async function track(
  event: TrackLegacyInput,
  payload?: Record<string, unknown>,
  options?: TrackOptions
): Promise<void> {
  await singleton.track(event, payload, options)
}

export async function identify(
  userOrEvent: IdentifyLegacyInput,
  traits?: Record<string, unknown>,
  options?: IdentifyOptions
): Promise<void> {
  await singleton.identify(userOrEvent, traits, options)
}

export async function page(
  properties?: Record<string, unknown>,
  options?: TrackOptions
): Promise<void> {
  await singleton.page(properties, options)
}

export async function flush(): Promise<void> {
  await singleton.flush()
}

export function getQueueSize(): number {
  return singleton.getQueueSize()
}

export function getDebugInfo() {
  return singleton.getDebugInfo()
}
