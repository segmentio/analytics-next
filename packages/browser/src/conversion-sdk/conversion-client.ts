import { AnalyticsBrowser } from '../browser'
import type { Analytics } from '../core/analytics'
import {
  conversionCdnSettingsMinimal,
  conversionGptSlotEventsPlugin,
  conversionPipelinePlugins,
} from '../plugins/conversion-collector'
import { getOrCreateSessionId } from '../plugins/conversion-collector/lib/session'
import { mountDebugPanel } from './debug'
import {
  flushCollectorQueue,
  resolveCollectorBuffer,
  stopCollectorQueue,
} from './collector-runtime'
import { DEFAULT_INIT_CONFIG, toCollectorSettings } from './config'
import { normalizeIdentifyCall, normalizeTrackCall } from './legacy-args'
import type {
  AnalyticsInitConfig,
  DebugInfo,
  IdentifyLegacyInput,
  IdentifyOptions,
  TrackLegacyInput,
  TrackOptions,
} from './types'
import type { BatchBuffer } from '../plugins/conversion-collector/batch-buffer'

const CONVERSION_COLLECTOR_PLUGIN = 'Conversion Collector'

export class ConversionClient {
  private config: AnalyticsInitConfig = { ...DEFAULT_INIT_CONFIG }
  private loadPromise: Promise<Analytics> | null = null
  private analytics: Analytics | null = null
  private lastError: string | undefined
  private collectorBuffer: BatchBuffer | undefined
  private bootstrapGeneration = 0

  init(config: AnalyticsInitConfig): void {
    this.config = {
      ...DEFAULT_INIT_CONFIG,
      ...config,
    }
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
    const collectorSettings = toCollectorSettings(this.config)
    const useGpt = this.config.enableGptSlotEvents !== false
    const plugins = [
      ...conversionPipelinePlugins({
        ...collectorSettings,
        enableGptSlotEvents: false,
      }),
      ...(useGpt ? [conversionGptSlotEventsPlugin()] : []),
    ]

    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: 'conversion-pipeline',
        cdnSettings: conversionCdnSettingsMinimal,
        cdnURL: 'https://cdn.conversion-pipeline.local',
        plugins,
      },
      {
        integrations: { 'Segment.io': false },
      }
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
      sessionId: this.config.getSessionId?.() ?? getOrCreateSessionId(),
      queueSize: this.getQueueSize(),
      lastError: this.lastError,
    }
  }

  async getAnalyticsInstance(): Promise<Analytics> {
    return this.ready()
  }
}
