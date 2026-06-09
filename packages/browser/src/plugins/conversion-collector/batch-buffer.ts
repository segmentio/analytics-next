import type { CollectEvent } from './types'
import {
  readPersistedEventQueue,
  writePersistedEventQueue,
  writePersistedEventQueueSync,
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

function incrementRetryCount(event: CollectEvent): CollectEvent {
  const retryCount = (event._retryCount ?? 0) + 1
  return { ...event, _retryCount: retryCount }
}

export class BatchBuffer {
  private queue: CollectEvent[] = []
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

  enqueue(event: CollectEvent): void {
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

  private persistQueueSync(): void {
    writePersistedEventQueueSync(this.queue)
  }

  private peekBatch(maxSize = this.config.batchSize): CollectEvent[] {
    return this.queue.slice(0, maxSize)
  }

  private removeBatch(count: number): void {
    this.queue.splice(0, count)
  }

  private requeueFront(batch: CollectEvent[]): void {
    this.queue.unshift(...batch.map(incrementRetryCount))
    this.persistQueue()
  }

  private bumpRetryInPlace(count: number, sync = false): void {
    for (let i = 0; i < count && i < this.queue.length; i += 1) {
      this.queue[i] = incrementRetryCount(this.queue[i]!)
    }
    if (sync) {
      this.persistQueueSync()
    } else {
      this.persistQueue()
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return
    }

    this.flushing = true
    const batch = this.peekBatch()
    const batchSize = batch.length

    try {
      await sendEventsToCollect(batch, this.config)
      this.removeBatch(batchSize)
      this.persistQueue()
    } catch (error) {
      if (error instanceof CollectDeliveryError && !error.retryable) {
        this.persistQueue()
        throw error
      }
      this.bumpRetryInPlace(batchSize)
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
    const syncPersist = options?.unload === true

    while (this.queue.length > 0) {
      const batch = this.peekBatch(this.queue.length)
      const batchSize = batch.length
      const body = buildCollectRequestBody(batch)

      const onSuccess = () => {
        this.removeBatch(batchSize)
        if (syncPersist) {
          this.persistQueueSync()
        } else {
          this.persistQueue()
        }
      }

      const onRetryableFailure = () => {
        this.bumpRetryInPlace(batchSize, syncPersist)
      }

      if (options?.unload) {
        if (sendCollectViaBeacon(this.config.endpoint, body)) {
          onSuccess()
          continue
        }

        try {
          await deliverCollectPayload(body, this.config, { keepalive: true })
          onSuccess()
          continue
        } catch (error) {
          if (error instanceof CollectDeliveryError && !error.retryable) {
            if (syncPersist) {
              this.persistQueueSync()
            } else {
              this.persistQueue()
            }
            throw error
          }
          onRetryableFailure()
          throw error
        }
      }

      try {
        await sendEventsToCollect(batch, this.config)
        onSuccess()
      } catch (error) {
        if (error instanceof CollectDeliveryError && !error.retryable) {
          if (syncPersist) {
            this.persistQueueSync()
          } else {
            this.persistQueue()
          }
          throw error
        }
        onRetryableFailure()
        throw error
      }
    }
  }
}
