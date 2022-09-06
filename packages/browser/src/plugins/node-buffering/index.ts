import { v4 as uuid } from '@lukeed/uuid'
import fetch from 'node-fetch'
import { Context } from '../../core/context'
import { SegmentEvent } from '../../core/events'
import { Plugin } from '../../core/plugin'
import { extractPromiseParts } from '../../lib/extract-promise-parts'
import { backoff } from '../../lib/priority-queue/backoff'
import { sleep } from '../../lib/sleep'

const MAX_MESSAGE_SIZE_IN_BYTES = 32 * 1024 // 32 KB
const MAX_BATCH_SIZE_IN_BYTES = 500 * 1024 - 10 // 500 KB (10 bytes given as padding)

export interface SegmentNodePluginProps {
  maxWaitTimeInMs: number
  maxEventsInBatch: number
  writeKey: string
}

export class SegmentNodePlugin implements Plugin {
  private queue: Queue
  name = 'Segment.io'
  type = 'after' as const
  version = '1.0.0'

  constructor({
    maxEventsInBatch,
    maxWaitTimeInMs,
    writeKey,
  }: SegmentNodePluginProps) {
    this.queue = new Queue({
      maxEventsInBatch,
      maxWaitTimeInMs,
      writeKey,
    })
  }

  load(ctx: Context) {
    return Promise.resolve(ctx)
  }

  isLoaded() {
    return true
  }

  alias(ctx: Context): Promise<Context> {
    return this.action(ctx)
  }

  group(ctx: Context): Promise<Context> {
    return this.action(ctx)
  }

  identify(ctx: Context): Promise<Context> {
    return this.action(ctx)
  }

  page(ctx: Context): Promise<Context> {
    return this.action(ctx)
  }

  screen(ctx: Context): Promise<Context> {
    return this.action(ctx)
  }

  track(ctx: Context): Promise<Context> {
    return this.action(ctx)
  }

  private action(ctx: Context): Promise<Context> {
    this.normalizeEvent(ctx)
    return this.queue.enqueue(ctx)
  }

  private normalizeEvent(ctx: Context) {
    ctx.updateEvent('context.library.name', 'AnalyticsNode')
    ctx.updateEvent('context.library.version', '1.0.0')
    ctx.updateEvent('_metadata.nodeVersion', process.versions.node)
  }
}

async function send(batch: ContextBatch, writeKey: string) {
  const events = batch.getEvents()
  const payload = JSON.stringify({ batch: events })
  const maxAttempts = 4

  const auth = Buffer.from(`${writeKey}:`).toString('base64')

  do {
    const currentAttempt = batch.incrementAttempts()
    const response = await fetch(`https://api.segment.io/v1/batch`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: payload,
    })

    // Successfully sent events, so exit!
    if (response.ok) {
      batch.resolveEvents()
      return
    }

    // Final attempt failed, update context and resolve events
    if (currentAttempt === maxAttempts) {
      batch.getContexts().forEach((ctx) =>
        ctx.setFailedDelivery({
          reason: `[${response.status}] ${response.statusText}`,
        })
      )
      batch.resolveEvents()
      return
    }

    // apply backoff and retry
    await sleep(backoff({ attempt: batch.getAttempts() }))
  } while (batch.getAttempts() < maxAttempts)
}

/**
 * Let's keep track of the batches
 *
 * 2 limits:
 *  - # of events
 *  - time elapsed since batch creation
 *
 * Whenever a context makes it to the plugin, we need to:
 * 1. Normalize the event.
 *
 *
 * Flow:
 * 1. Normalize event
 * 2. Create batch
 * 3. Add event to batch
 * 4. schedule flush in `timeout` ms
 *
 * - Normalize event
 * - add event to batch - hit limit so tryAdd returns false
 * - immediately flush event - cancel the scheduled flush
 */

interface QueueProps {
  maxWaitTimeInMs: number
  maxEventsInBatch: number
  writeKey: string
}

class Queue {
  private pendingFlushTimeout?: ReturnType<typeof setTimeout>
  private batch?: ContextBatch

  private _maxWaitTimeInMs: number
  private _maxEventsInBatch: number
  private _writeKey: string

  constructor({ maxEventsInBatch, maxWaitTimeInMs, writeKey }: QueueProps) {
    this._maxEventsInBatch = maxEventsInBatch
    this._maxWaitTimeInMs = maxWaitTimeInMs
    this._writeKey = writeKey
  }

  private createBatch(): ContextBatch {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    const batch = new ContextBatch(this._maxEventsInBatch)
    this.batch = batch
    this.pendingFlushTimeout = setTimeout(() => {
      this.batch = undefined
      this.pendingFlushTimeout = undefined
      send(batch, this._writeKey).catch(console.error)
    }, this._maxWaitTimeInMs)
    return batch
  }

  private clearBatch() {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    this.batch = undefined
  }

  enqueue(ctx: Context): Promise<Context> {
    const batch = this.batch ?? this.createBatch()

    const { promise: contextPromise, resolve } = extractPromiseParts<Context>()
    const pendingItem: PendingItem = {
      context: ctx,
      resolver: resolve,
    }

    /**
     * If event was added to batch and
     *  - batch length equals max event count: SEND
     *  - batch length is less than max event count: DON'T SEND
     *
     * If event was not added to batch:
     *  - send existing batch if it has events - if no events, fail event
     */

    if (batch.tryAdd(pendingItem)) {
      if (batch.length === this._maxEventsInBatch) {
        send(batch, this._writeKey).catch(console.error)
        this.clearBatch()
      }
      return contextPromise
    }

    const fallbackBatch = this.createBatch()
    this.batch = fallbackBatch

    if (!batch.tryAdd(pendingItem)) {
      ctx.setFailedDelivery({
        reason: new Error(`Event exceeds maximum event size`),
      })
      return Promise.resolve(ctx)
    } else {
      if (batch.length === this._maxEventsInBatch) {
        send(batch, this._writeKey).catch(console.error)
        this.clearBatch()
      }
      return contextPromise
    }
  }
}

interface PendingItem {
  resolver: (ctx: Context) => void
  context: Context
}

class ContextBatch {
  public id = uuid()
  private items: PendingItem[] = []
  private sizeInBytes = 0 // TODO: Add padding
  private attempts = 0
  private maxEventCount: number

  constructor(maxEventCount: number) {
    this.maxEventCount = Math.max(1, maxEventCount)
  }
  public tryAdd(item: PendingItem) {
    if (this.length === this.maxEventCount) return false

    const eventSize = this.calculateSize(item.context)
    if (this.sizeInBytes + eventSize <= MAX_BATCH_SIZE_IN_BYTES) {
      this.items.push(item)
      this.sizeInBytes += eventSize
      return true
    }
    return false
  }

  get length(): number {
    return this.items.length
  }

  private calculateSize(ctx: Context): number {
    return encodeURI(JSON.stringify(ctx.event)).split(/%..|i/).length
  }

  getEvents(): SegmentEvent[] {
    const events = this.items.map(({ context }) => context.event)
    return events
  }

  getContexts(): Context[] {
    return this.items.map((item) => item.context)
  }

  resolveEvents(): void {
    this.items.forEach(({ resolver, context }) => resolver(context))
  }

  getAttempts(): number {
    return this.attempts
  }

  incrementAttempts(): number {
    this.attempts++
    return this.attempts
  }
}
