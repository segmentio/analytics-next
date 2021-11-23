import fetch from 'unfetch'
import { version } from '../../../build/build'

export interface MetricsOptions {
  host?: string
  sampleRate?: number
  flushTimer?: number
  maxQueueSize?: number
}

type Metric = { type: 'Counter'; metric: string; value: number; tags: object }

export class RemoteMetrics {
  private host: string
  private flushTimer: number
  private maxQueueSize: number

  sampleRate: number
  queue: Metric[]

  constructor(options?: MetricsOptions) {
    this.host = options?.host ?? 'api.segment.io/v1'
    this.sampleRate = options?.sampleRate ?? 1
    this.flushTimer = options?.flushTimer ?? 30 * 1000 /* 30s */
    this.maxQueueSize = options?.maxQueueSize ?? 20

    this.queue = []

    if (this.sampleRate > 0) {
      let flushing = false

      const run = (): void => {
        if (flushing) {
          return
        }

        flushing = true
        this.flush().catch((err) => {
          console.error(err)
        })

        flushing = false

        setTimeout(run, this.flushTimer)
      }
      run()
    }
  }

  increment(metric: string, tags: string[]): void {
    // All metrics are part of an allow list in Tracking API
    if (!metric.includes('analytics_js.')) {
      return
    }

    // /m doesn't like empty tags
    if (tags.length === 0) {
      return
    }

    if (Math.random() > this.sampleRate) {
      return
    }

    if (this.queue.length >= this.maxQueueSize) {
      return
    }

    const formatted = tags.reduce((acc, t) => {
      const [k, v] = t.split(':')
      acc[k] = v
      return acc
    }, {} as Record<string, string>)

    formatted['library'] = 'analytics.js'
    formatted['library_version'] = `next-${version}` ?? 'next-undefined'

    this.queue.push({
      type: 'Counter',
      metric,
      value: 1,
      tags: formatted,
    })

    if (metric.includes('error')) {
      this.flush().catch((err) => console.error(err))
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length <= 0) {
      return
    }

    await this.send().catch((error) => {
      console.error(error)
      this.sampleRate = 0
    })
  }

  private async send(): Promise<Response> {
    const payload = { series: this.queue }
    this.queue = []

    const headers = { 'Content-Type': 'text/plain' }
    const url = `https://${this.host}/m`

    return fetch(url, {
      headers,
      body: JSON.stringify(payload),
      method: 'POST',
    })
  }
}
