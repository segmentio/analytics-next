import type { Analytics } from '../core/analytics'
import { getCurrentSessionId } from '../plugins/conversion-collector/lib/session'
import {
  flushCollectorQueue,
  resolveCollectorBuffer,
  stopCollectorQueue,
} from './collector-runtime'
import { DEFAULT_INIT_CONFIG } from './config'
import { conversionGptSlotEventsPlugin } from './gpt-plugin'
import { loadLeanConversionAnalytics } from './lean-load'
import { normalizeIdentifyCall, normalizeTrackCall } from './legacy-args'
import type {
  AnalyticsInitConfig,
  DebugInfo,
  IdentifyLegacyInput,
  IdentifyOptions,
  TrackLegacyInput,
  TrackOptions,
} from './types'
import { resolveInitConfig } from './write-key-config'
import type { BatchBuffer } from '../plugins/conversion-collector/batch-buffer'

const CONVERSION_COLLECTOR_PLUGIN = 'Conversion Collector'

export class ConversionClient {
  private config: AnalyticsInitConfig = { ...DEFAULT_INIT_CONFIG }
  private loadPromise: Promise<Analytics> | null = null
  private analytics: Analytics | null = null
  private lastError: string | undefined
  private collectorBuffer: BatchBuffer | undefined
  private bootstrapGeneration = 0

  init(
    writeKeyOrConfig: string | AnalyticsInitConfig,
    options?: Partial<AnalyticsInitConfig>
  ): void {
    this.config = resolveInitConfig(writeKeyOrConfig, options)
    this.lastError = undefined
    const previousAnalytics = this.analytics
    const previousLoadPromise = this.loadPromise
    this.analytics = null
    this.collectorBuffer = undefined
    const generation = ++this.bootstrapGeneration
    this.loadPromise = this.bootstrapWithTeardown(
      generation,
      previousAnalytics,
      previousLoadPromise
    )
  }

  private async stopAnalyticsInstance(analytics: Analytics): Promise<void> {
    await stopCollectorQueue(analytics)
    try {
      await analytics.deregister(CONVERSION_COLLECTOR_PLUGIN)
    } catch {
      // Plugin may not have finished loading.
    }
  }

  private async bootstrapWithTeardown(
    generation: number,
    previousAnalytics: Analytics | null,
    previousLoadPromise: Promise<Analytics> | null
  ): Promise<Analytics> {
    if (previousAnalytics) {
      await this.stopAnalyticsInstance(previousAnalytics)
    } else if (previousLoadPromise) {
      try {
        const previous = await previousLoadPromise
        if (previous !== this.analytics) {
          await this.stopAnalyticsInstance(previous)
        }
      } catch {
        // Previous bootstrap failed or was superseded.
      }
    }

    return this.bootstrap(generation)
  }

  private async bootstrap(generation: number): Promise<Analytics> {
    const extraPlugins = this.config.enableGptSlotEvents
      ? [conversionGptSlotEventsPlugin()]
      : []

    const analytics = await loadLeanConversionAnalytics(
      this.config,
      extraPlugins
    )

    if (generation !== this.bootstrapGeneration) {
      await this.stopAnalyticsInstance(analytics)
      return analytics
    }

    analytics.on('error', (payload) => {
      const reason = payload?.reason ?? payload
      this.lastError = reason instanceof Error ? reason.message : String(reason)
      this.config.onError?.(reason)
    })

    if (this.config.debug) {
      const { mountDebugPanel } = await import('./debug')
      mountDebugPanel(() => this.getDebugInfo())
    }

    this.analytics = analytics
    this.collectorBuffer = resolveCollectorBuffer(analytics)
    return analytics
  }

  private async ready(): Promise<Analytics> {
    if (!this.loadPromise) {
      throw new Error(
        'Conversion analytics SDK is not initialized. Call init() first.'
      )
    }
    return this.loadPromise
  }

  start(): void {
    void this.ready()
  }

  async stop(): Promise<void> {
    const analytics = await this.ready()
    await this.stopAnalyticsInstance(analytics)
    this.analytics = null
    this.collectorBuffer = undefined
    this.loadPromise = null
  }

  async track(
    event: TrackLegacyInput,
    payload?: Record<string, unknown>,
    options?: TrackOptions
  ): Promise<void> {
    const analytics = await this.ready()
    const { eventName, properties } = normalizeTrackCall(event, payload)
    await analytics.track(eventName, properties, options)
  }

  async page(
    properties?: Record<string, unknown>,
    options?: TrackOptions
  ): Promise<void> {
    const analytics = await this.ready()
    await analytics.page(properties ?? {}, options)
  }

  async identify(
    userOrEvent: IdentifyLegacyInput,
    traits?: Record<string, unknown>,
    options?: IdentifyOptions
  ): Promise<void> {
    const analytics = await this.ready()
    const { userId, traits: normalizedTraits } = normalizeIdentifyCall(
      userOrEvent,
      traits
    )
    if (userId) {
      await analytics.identify(userId, normalizedTraits, options)
      return
    }
    await analytics.identify(normalizedTraits, options)
  }

  async flush(): Promise<void> {
    const analytics = await this.ready()
    await flushCollectorQueue(analytics)
    this.collectorBuffer = resolveCollectorBuffer(analytics)
  }

  getQueueSize(): number {
    return this.collectorBuffer?.getSize() ?? 0
  }

  getDebugInfo(): DebugInfo {
    return {
      endpoint: this.config.endpoint ?? DEFAULT_INIT_CONFIG.endpoint,
      sessionId: this.config.getSessionId?.() ?? getCurrentSessionId(),
      queueSize: this.getQueueSize(),
      lastError: this.lastError,
    }
  }

  async getAnalyticsInstance(): Promise<Analytics> {
    return this.ready()
  }
}
