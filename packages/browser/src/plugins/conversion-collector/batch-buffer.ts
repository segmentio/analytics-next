import type { AnalyticsEventEnvelope } from './types'
import {
  readPersistedEventQueue,
  writePersistedEventQueue,
} from './lib/event-queue-storage'
import {
  buildCollectRequestBody,
  CollectDeliveryError,
  deliverCollectPayload,
  sendCollectViaBeacon,
  sendEventsToCollect,
  type CollectSendConfig,
} from './send-events'

export interface BatchBufferConfig extends CollectSendConfig {
  flushIntervalMs: number
  batchSize: number
}

export class BatchBuffer {
  private queue: AnalyticsEventEnvelope[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private flushing = false

  constructor(private readonly config: BatchBufferConfig) {
    this.hydrateFromStorage()
  }

  start(): void {
    if (this.timer) {
      return
    }
    this.timer = setInterval(() => {
      void this.flush()
    }, this.config.flushIntervalMs)
    void this.flush()
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  enqueue(event: AnalyticsEventEnvelope): void {
    this.queue.push(event)
    this.persistQueue()
    if (this.queue.length >= this.config.batchSize) {
      void this.flush()
    }
  }

  getSize(): number {
    return this.queue.length
  }

  private hydrateFromStorage(): void {
    const persisted = readPersistedEventQueue()
    if (persisted.length > 0) {
      this.queue = [...persisted, ...this.queue]
      this.persistQueue()
    }
  }

  private persistQueue(): void {
    writePersistedEventQueue(this.queue)
  }

  private takeBatch(maxSize = this.config.batchSize): AnalyticsEventEnvelope[] {
    return this.queue.splice(0, maxSize)
  }

  private requeueFront(batch: AnalyticsEventEnvelope[]): void {
    this.queue.unshift(...batch)
    this.persistQueue()
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return
    }

    this.flushing = true
    const batch = this.takeBatch()

    try {
      await sendEventsToCollect(batch, this.config)
      this.persistQueue()
    } catch (error) {
      if (error instanceof CollectDeliveryError && !error.retryable) {
        this.persistQueue()
        throw error
      }
      this.requeueFront(batch)
      throw error
    } finally {
      this.flushing = false
      if (this.queue.length >= this.config.batchSize) {
        void this.flush()
      }
    }
  }

  /**
   * Drains the queue. Uses sendBeacon on unload when the payload fits; otherwise keepalive fetch.
   */
  async flushAll(options?: { unload?: boolean }): Promise<void> {
    this.stop()

    while (this.queue.length > 0) {
      const batch = this.takeBatch(this.queue.length)
      const body = buildCollectRequestBody(batch)

      if (options?.unload) {
        if (sendCollectViaBeacon(this.config.endpoint, body)) {
          this.persistQueue()
          continue
        }

        try {
          await deliverCollectPayload(body, this.config, { keepalive: true })
          this.persistQueue()
          continue
        } catch (error) {
          if (error instanceof CollectDeliveryError && !error.retryable) {
            this.persistQueue()
            throw error
          }
          this.requeueFront(batch)
          throw error
        }
      }

      try {
        await sendEventsToCollect(batch, this.config)
        this.persistQueue()
      } catch (error) {
        if (error instanceof CollectDeliveryError && !error.retryable) {
          this.persistQueue()
          throw error
        }
        this.requeueFront(batch)
        throw error
      }
    }
  }
}
