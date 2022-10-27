import { backoff, CoreContext } from '@segment/analytics-core'
import fetch from 'node-fetch'
import { extractPromiseParts } from '../../lib/extract-promise-parts'
import { ContextBatch } from './context-batch'

function sleep(timeoutInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
}

function noop() {}

interface PendingItem {
  resolver: (ctx: CoreContext) => void
  context: CoreContext
}

export interface PublisherProps {
  endpoint?: string
  maxWaitTimeInMs: number
  maxEventsInBatch: number
  maxAttempts: number
  writeKey: string
}

/**
 * The Publisher is responsible for batching events and sending them to the Segment API.
 */
export class Publisher {
  private pendingFlushTimeout?: ReturnType<typeof setTimeout>
  private batch?: ContextBatch

  private _maxWaitTimeInMs: number
  private _maxEventsInBatch: number
  private _maxAttempts: number
  private _auth: string
  private _endpoint: string

  constructor({
    endpoint,
    maxAttempts,
    maxEventsInBatch,
    maxWaitTimeInMs,
    writeKey,
  }: PublisherProps) {
    this._maxAttempts = Math.max(maxAttempts, 1)
    this._maxEventsInBatch = Math.max(maxEventsInBatch, 1)
    this._maxWaitTimeInMs = maxWaitTimeInMs
    this._auth = Buffer.from(`${writeKey}:`).toString('base64')
    this._endpoint = endpoint ?? 'https://api.segment.io'
  }

  private createBatch(): ContextBatch {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    const batch = new ContextBatch(this._maxEventsInBatch)
    this.batch = batch
    this.pendingFlushTimeout = setTimeout(() => {
      if (batch === this.batch) {
        this.batch = undefined
      }
      this.pendingFlushTimeout = undefined
      if (batch.length) {
        this.send(batch).catch(noop)
      }
    }, this._maxWaitTimeInMs)
    return batch
  }

  private clearBatch() {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    this.batch = undefined
  }

  /**
   * Enqueues the context for future delivery.
   * @param ctx - Context containing a Segment event.
   * @returns a promise that resolves with the context after the event has been delivered.
   */
  enqueue(ctx: CoreContext): Promise<CoreContext> {
    const batch = this.batch ?? this.createBatch()

    const { promise: ctxPromise, resolve } = extractPromiseParts<CoreContext>()

    const pendingItem: PendingItem = {
      context: ctx,
      resolver: resolve,
    }

    /*
      The following logic ensures that a batch is never orphaned,
      and is always sent before a new batch is created.

      Add an event to the existing batch.
        Success: Check if batch is full and send if it is.
        Failure: Assume event is too big to fit in current batch - send existing batch.
          Add an event to the new batch.
            Success: Check if batch is full and send if it is.  
            Failure: Event exceeds maximum size (it will never fit), fail the event.
    */

    if (batch.tryAdd(pendingItem)) {
      if (batch.length === this._maxEventsInBatch) {
        this.send(batch).catch(noop)
        this.clearBatch()
      }
      return ctxPromise
    } else if (batch.length) {
      this.send(batch).catch(noop)
      this.clearBatch()
    }

    const fallbackBatch = this.createBatch()

    if (!fallbackBatch.tryAdd(pendingItem)) {
      ctx.setFailedDelivery({
        reason: new Error(`Event exceeds maximum event size of 32 kb`),
      })
      return Promise.resolve(ctx)
    } else {
      if (fallbackBatch.length === this._maxEventsInBatch) {
        this.send(fallbackBatch).catch(noop)
        this.clearBatch()
      }
      return ctxPromise
    }
  }

  private async send(batch: ContextBatch) {
    const events = batch.getEvents()
    const payload = JSON.stringify({ batch: events })
    const maxAttempts = this._maxAttempts

    while (batch.getAttempts() < maxAttempts) {
      const currentAttempt = batch.incrementAttempts()

      let failureReason: unknown
      try {
        const response = await fetch(`${this._endpoint}/v1/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this._auth}`,
            'User-Agent': 'analytics-node-next/latest',
          },
          body: payload,
        })

        if (response.ok) {
          // Successfully sent events, so exit!
          batch.resolveEvents()
          return
        } else if (response.status === 400) {
          // https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/#max-request-size
          // Request either malformed or size exceeded - don't retry.
          resolveFailedBatch(
            batch,
            `[${response.status}] ${response.statusText}`
          )
          return
        } else {
          // Treat other errors as transient and retry.
          failureReason = `[${response.status}] ${response.statusText}`
        }
      } catch (err) {
        // Network errors get thrown, retry them.
        failureReason = err
      }

      // Final attempt failed, update context and resolve events.
      if (currentAttempt === maxAttempts) {
        resolveFailedBatch(batch, failureReason)
        return
      }

      // Retry after attempt-based backoff.
      await sleep(
        backoff({
          attempt: batch.getAttempts(),
          minTimeout: 25,
          maxTimeout: 1000,
        })
      )
    }
  }
}

function resolveFailedBatch(batch: ContextBatch, reason: unknown) {
  batch.getContexts().forEach((ctx) => ctx.setFailedDelivery({ reason }))
  batch.resolveEvents()
}
