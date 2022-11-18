import { backoff, CoreContext } from '@segment/analytics-core'
import { tryCreateFormattedUrl } from '../../lib/create-url'
import { extractPromiseParts } from '../../lib/extract-promise-parts'
import { fetch } from '../../lib/fetch'
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
  host?: string
  path?: string
  flushInterval: number
  maxEventsInBatch: number
  maxRetries: number
  writeKey: string
}

/**
 * The Publisher is responsible for batching events and sending them to the Segment API.
 */
export class Publisher {
  private pendingFlushTimeout?: ReturnType<typeof setTimeout>
  public batch?: ContextBatch

  private _flushInterval: number
  private _maxEventsInBatch: number
  private _maxRetries: number
  private _auth: string
  private _url: string
  private _closeAndFlushPendingItemsCount?: number

  constructor({
    host,
    path,
    maxRetries,
    maxEventsInBatch,
    flushInterval,
    writeKey,
  }: PublisherProps) {
    this._maxRetries = maxRetries
    this._maxEventsInBatch = Math.max(maxEventsInBatch, 1)
    this._flushInterval = flushInterval
    this._auth = Buffer.from(`${writeKey}:`).toString('base64')
    this._url = tryCreateFormattedUrl(
      host ?? 'https://api.segment.io',
      path ?? '/v1/batch'
    )
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
    }, this._flushInterval)
    return batch
  }

  private clearBatch() {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    this.batch = undefined
  }

  flushAfterClose(pendingItemsCount: number) {
    if (!pendingItemsCount) {
      // if number of pending items is 0, there will never be anything else entering the batch, since the app is closed.
      return
    }

    this._closeAndFlushPendingItemsCount = pendingItemsCount

    // if batch is empty, there's nothing to flush, and when things come in, enqueue will handle them.
    if (!this.batch) return

    // the number of globally pending items will always be larger or the same as batch size.
    // Any mismatch is because some globally pending items are in plugins.
    const isExpectingNoMoreItems = this.batch.length === pendingItemsCount
    if (isExpectingNoMoreItems) {
      this.send(this.batch).catch(noop)
      this.clearBatch()
    }
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
        Success: Check if batch is full or no more items are expected to come in (i.e. closing). If so, send batch.
        Failure: Assume event is too big to fit in current batch - send existing batch.
          Add an event to the new batch.
            Success: Check if batch is full and send if it is.
            Failure: Event exceeds maximum size (it will never fit), fail the event.
    */

    if (batch.tryAdd(pendingItem)) {
      const isFull = batch.length === this._maxEventsInBatch
      const isExpectingNoMoreItems =
        batch.length === this._closeAndFlushPendingItemsCount

      if (isFull || isExpectingNoMoreItems) {
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
    const maxAttempts = this._maxRetries + 1

    let currentAttempt = 0
    while (currentAttempt < maxAttempts) {
      currentAttempt++

      let failureReason: unknown
      try {
        const response = await fetch(this._url, {
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
            new Error(`[${response.status}] ${response.statusText}`)
          )
          return
        } else {
          // Treat other errors as transient and retry.
          failureReason = new Error(
            `[${response.status}] ${response.statusText}`
          )
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
          attempt: currentAttempt,
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
