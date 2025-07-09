import { Analytics, segmentio } from '@segment/analytics-next'
import { logger } from '../../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'
import { redactSignalData } from './redact'

export class SignalsIngestSettings {
  flushAt: number
  flushInterval: number
  apiHost: string
  shouldDisableSignalsRedaction: () => boolean
  shouldIngestSignals: () => boolean
  writeKey?: string
  constructor(settings: SignalsIngestSettingsConfig) {
    this.flushAt = settings.flushAt ?? 5
    this.apiHost = settings.apiHost ?? 'signals.segment.io/v1'
    this.flushInterval = settings.flushInterval ?? 2000
    this.shouldDisableSignalsRedaction =
      settings.shouldDisableSignalsRedaction ?? (() => false)
    this.shouldIngestSignals = settings.shouldIngestSignals ?? (() => false)
  }
}

export interface SignalsIngestSettingsConfig {
  apiHost?: string
  flushAt?: number
  flushInterval?: number
  shouldDisableSignalsRedaction?: () => boolean
  shouldIngestSignals?: () => boolean
}
/**
 * This currently just uses the Segment analytics-next library to send signals.
 * This persists the signals in a queue until the client is initialized.
 */
export class SignalsIngestClient {
  private settings: SignalsIngestSettings
  private analytics: Promise<Analytics>

  /**
   * This matters to sort the signals in the UI if the timestamp conflict (which can happen very very rarely)
   */
  private index = 0

  constructor(writeKey: string, settings: SignalsIngestSettingsConfig = {}) {
    this.settings = new SignalsIngestSettings(settings)
    this.analytics = this.createAnalyticsClient({ writeKey })
  }

  private async createAnalyticsClient(settings: { writeKey: string }) {
    const analytics = new Analytics({ writeKey: settings.writeKey })
    this.settings.writeKey = analytics.settings.writeKey
    await analytics.register(
      segmentio(analytics, {
        apiHost: this.settings.apiHost,
        apiKey: this.settings.writeKey,
        deliveryStrategy: {
          config: {
            size: this.settings.flushAt,
            timeout: this.settings.flushInterval,
          },
          strategy: 'batching',
        },
      })
    )

    analytics.emit('initialize', settings)
    analytics.on('track', (...args) => {
      logger.debug('Track event from analytics client', ...args)
    })
    return analytics
  }

  private async sendTrackCall(signal: Signal) {
    const analytics = await this.analytics
    if (!this.settings.shouldIngestSignals()) {
      return
    }
    const disableRedaction = this.settings.shouldDisableSignalsRedaction()
    const cleanSignal = disableRedaction ? signal : redactSignalData(signal)

    if (disableRedaction) {
      logger.debug('Sending unredacted data to segment', cleanSignal)
    }

    const MAGIC_EVENT_NAME = 'Segment Signal Generated'

    return analytics.track(MAGIC_EVENT_NAME, {
      ...cleanSignal,
      index: this.index++,
    })
  }

  send(signal: Signal) {
    return this.sendTrackCall(signal)
  }
}
