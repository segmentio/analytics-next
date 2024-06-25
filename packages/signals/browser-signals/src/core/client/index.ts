import { Analytics, segmentio } from '@segment/analytics-next'
import { logger } from '../../lib/logger'
import { Signal } from '../../types'

class SignalsIngestSettings {
  flushAt: number
  apiHost: string
  writeKey?: string
  constructor(settings: SignalsIngestSettingsConfig) {
    this.flushAt = settings.flushAt ?? 3
    this.apiHost = settings.apiHost ?? 'signals.segment.io/v1'
  }
}

const MAGIC_EVENT_NAME = 'Segment Signal Generated'

function redact(text: string) {
  return text.replace(/[a-zA-Z]/g, 'X').replace(/[0-9]/g, '9')
}

function redactJsonValues(data: any, depth = 0): any {
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) => redactJsonValues(item, depth + 1))
    } else {
      const redactedData: any = {}
      for (const key in data) {
        redactedData[key] = redactJsonValues(data[key], depth + 1)
      }
      return redactedData
    }
  } else if (typeof data === 'string' && depth >= 2) {
    return redact(data)
  } else {
    return data
  }
}

export interface SignalsIngestSettingsConfig {
  apiHost?: string
  flushAt?: number
}
/**
 * This currently just uses the Segment analytics-next library to send signals.
 * This persists the signals in a queue until the client is initialized.
 */
export class SignalsIngestClient {
  private buffer: Signal[]

  private settings: SignalsIngestSettings
  private analytics: Analytics | undefined

  /**
   * This matters to sort the signals in the UI if the timestamp conflict (which can happen very very rarely)
   */
  private index = 0

  constructor(settings: SignalsIngestSettingsConfig = {}) {
    this.settings = new SignalsIngestSettings(settings)
    this.buffer = []
    this.analytics = undefined
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
  /**
   *  Initialize analytics and flush any events queue.
   */
  async init({ writeKey }: { writeKey: string }) {
    this.analytics = await this.createAnalyticsClient({ writeKey })
    this.flush()
    logger.debug('Init signals-analytics client', { writeKey })
  }

  send(signal: Signal) {
    if (!this.analytics) {
      logger.debug('Buffering signal', signal)
      this.buffer.push(signal)
    } else {
      const { data, type } = signal
      const redacted = redactJsonValues(data)
      logger.debug('Sending signal', {
        ...(type !== 'instrumentation' && data.eventType
          ? { eventType: data.eventType }
          : {}),
        type,
        data: redacted,
      })
      return this.analytics!.track(MAGIC_EVENT_NAME, {
        index: this.index++,
        type,
        data: redacted,
      })
    }
  }

  flush() {
    if (!this.analytics) {
      throw new Error('Please initialize before calling this method.')
    }
    logger.debug('Flushing signals', this.buffer)
    this.buffer.forEach(({ type, data }) => {
      void this.analytics!.track(MAGIC_EVENT_NAME, {
        type,
        data,
      })
    })
    this.buffer = []
  }
}
