import type {
  AnalyticsInitConfig,
  DebugInfo,
  IdentifyLegacyInput,
  IdentifyOptions,
  TrackLegacyInput,
  TrackOptions,
} from './types'
import { ConversionClient } from './conversion-client'

export class ConversionAnalyticsBrowser {
  private readonly client = new ConversionClient()

  static async load(
    writeKeyOrConfig: string | AnalyticsInitConfig,
    options?: Partial<AnalyticsInitConfig>
  ): Promise<ConversionAnalyticsBrowser> {
    const analytics = new ConversionAnalyticsBrowser()
    analytics.init(writeKeyOrConfig, options)
    await analytics.client.getAnalyticsInstance()
    return analytics
  }

  init(
    writeKeyOrConfig: string | AnalyticsInitConfig,
    options?: Partial<AnalyticsInitConfig>
  ): void {
    this.client.init(writeKeyOrConfig, options)
  }

  start(): void {
    this.client.start()
  }

  async stop(): Promise<void> {
    await this.client.stop()
  }

  async track(
    event: TrackLegacyInput,
    payload?: Record<string, unknown>,
    options?: TrackOptions
  ): Promise<void> {
    await this.client.track(event, payload, options)
  }

  async page(
    properties?: Record<string, unknown>,
    options?: TrackOptions
  ): Promise<void> {
    await this.client.page(properties, options)
  }

  async identify(
    userOrEvent: IdentifyLegacyInput,
    traits?: Record<string, unknown>,
    options?: IdentifyOptions
  ): Promise<void> {
    await this.client.identify(userOrEvent, traits, options)
  }

  async flush(): Promise<void> {
    await this.client.flush()
  }

  getQueueSize(): number {
    return this.client.getQueueSize()
  }

  getDebugInfo(): DebugInfo {
    return this.client.getDebugInfo()
  }
}
