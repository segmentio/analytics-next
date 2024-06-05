import { Analytics, segmentio } from '@segment/analytics-next'

export class SignalsClient {
  private index = 0
  private analytics: Analytics

  constructor(writeKey: any) {
    this.analytics = new Analytics({ writeKey })
    void this.analytics.register(
      segmentio(this.analytics, {
        apiHost: 'https://signals.segment.io/v1',
        apiKey: writeKey,
        deliveryStrategy: {
          strategy: 'batching',
          config: {
            size: 100,
            timeout: 30 * 1000,
          },
        },
      })
    )
  }

  public send(type: any, data: any): Promise<any> {
    return this.analytics
      .track('Segment Signal Generated', {
        type,
        index: this.index++,
        data,
      })
      .then((ctx) => {
        return ctx
      })
  }
}
