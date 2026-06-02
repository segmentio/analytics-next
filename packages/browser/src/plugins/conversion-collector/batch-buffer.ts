import type { AnalyticsEventEnvelope } from './types'
import { sendEventsToCollect, CollectSendConfig } from './send-events'

export interface BatchBufferConfig extends CollectSendConfig {
  flushIntervalMs: number
  batchSize: number
}

export class BatchBuffer {
  private queue: AnalyticsEventEnvelope[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private flushing = false

  constructor(private readonly config: BatchBufferConfig) {}

  start(): void {
    if (this.timer) {
      return
    }
    this.timer = setInterval(() => {
      void this.flush()
    }, this.config.flushIntervalMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  enqueue(event: AnalyticsEventEnvelope): void {
    this.queue.push(event)
    if (this.queue.length >= this.config.batchSize) {
      void this.flush()
    }
  }

  getSize(): number {
    return this.queue.length
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return
    }

    this.flushing = true
    const batch = this.queue.splice(0, this.config.batchSize)

    try {
      await sendEventsToCollect(batch, this.config)
    } catch (error) {
      this.queue.unshift(...batch)
      throw error
    } finally {
      this.flushing = false
    }
  }
}
