import type { AnalyticsEventEnvelope } from './types'
import {
  CollectNonRetryableError,
  sendEventsToCollect,
  CollectSendConfig,
  SendEventsOptions,
} from './send-events'
import {
  clearPersistedQueue,
  DEFAULT_MAX_QUEUE_SIZE,
  DEFAULT_QUEUE_PERSISTENCE_KEY,
  loadPersistedQueue,
  savePersistedQueue,
} from './queue-persistence'

export interface BatchBufferConfig extends CollectSendConfig {
  flushIntervalMs: number
  batchSize: number
  maxQueueSize?: number
  persistenceKey?: string
}

export class BatchBuffer {
  private queue: AnalyticsEventEnvelope[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private flushing = false
  private readonly maxQueueSize: number
  private readonly persistenceKey: string

  constructor(private readonly config: BatchBufferConfig) {
    this.maxQueueSize = config.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE
    this.persistenceKey = config.persistenceKey ?? DEFAULT_QUEUE_PERSISTENCE_KEY
    this.rehydrate()
  }

  private rehydrate(): void {
    const persisted = loadPersistedQueue(this.persistenceKey)
    if (persisted.length === 0) {
      return
    }
    this.queue = persisted.slice(-this.maxQueueSize)
    this.persist()
  }

  private persist(): void {
    savePersistedQueue(this.queue, this.maxQueueSize, this.persistenceKey)
  }

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
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(-this.maxQueueSize)
    }
    this.persist()
    if (this.queue.length >= this.config.batchSize) {
      void this.flush()
    }
  }

  getSize(): number {
    return this.queue.length
  }

  async flush(options: SendEventsOptions = {}): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return
    }

    this.flushing = true
    const batch = this.queue.splice(0, this.config.batchSize)
    this.persist()

    try {
      await sendEventsToCollect(batch, this.config, options)
      this.persist()
    } catch (error) {
      if (!(error instanceof CollectNonRetryableError)) {
        this.queue.unshift(...batch)
        if (this.queue.length > this.maxQueueSize) {
          this.queue = this.queue.slice(-this.maxQueueSize)
        }
      }
      this.persist()
      throw error
    } finally {
      this.flushing = false
    }
  }

  async flushAll(options: SendEventsOptions = {}): Promise<void> {
    while (this.queue.length > 0) {
      await this.flush(options)
    }
    clearPersistedQueue(this.persistenceKey)
  }
}
