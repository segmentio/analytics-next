import { backoff } from '@segment/analytics-core'
import type { Context } from '../../app/context'
import { tryCreateFormattedUrl } from '../../lib/create-url'
import { createDeferred } from '@segment/analytics-generic-utils'
import { ContextBatch } from './context-batch'
import { NodeEmitter } from '../../app/emitter'
import type { HTTPResponse } from '../../lib/http-client'
import { HTTPClient, HTTPClientRequest } from '../../lib/http-client'
import { OAuthSettings } from '../../lib/types'
import { TokenManager } from '../../lib/token-manager'
import { b64encode } from '../../lib/base-64-encode'

const MAX_RETRY_AFTER_SECONDS = 300

function sleep(timeoutInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
}

function noop() {}

function convertHeaders(
  headers: HTTPResponse['headers']
): Record<string, string> {
  const lowercaseHeaders: Record<string, string> = {}
  if (!headers) return lowercaseHeaders

  const candidate: any = headers

  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.entries === 'function'
  ) {
    for (const [name, value] of candidate.entries() as IterableIterator<
      [string, any]
    >) {
      lowercaseHeaders[name.toLowerCase()] = String(value)
    }
    return lowercaseHeaders
  }

  for (const [name, value] of Object.entries(candidate)) {
    lowercaseHeaders[name.toLowerCase()] = String(value)
  }

  return lowercaseHeaders
}

function getRetryAfterInSeconds(
  headers: HTTPResponse['headers']
): number | undefined {
  if (!headers) return undefined
  const lowercaseHeaders = convertHeaders(headers)
  const raw = lowercaseHeaders['retry-after']
  if (!raw) return undefined

  const seconds = parseInt(raw, 10)
  if (!Number.isFinite(seconds) || seconds < 0) {
    return undefined
  }

  return Math.min(seconds, MAX_RETRY_AFTER_SECONDS)
}

interface PendingItem {
  resolver: (ctx: Context) => void
  context: Context
}

export interface PublisherProps {
  host?: string
  path?: string
  flushInterval: number
  flushAt: number
  maxRetries: number
  writeKey: string
  httpRequestTimeout?: number
  disable?: boolean
  httpClient: HTTPClient
  oauthSettings?: OAuthSettings
}

/**
 * The Publisher is responsible for batching events and sending them to the Segment API.
 */
export class Publisher {
  private pendingFlushTimeout?: ReturnType<typeof setTimeout>
  private _batch?: ContextBatch

  private _flushInterval: number
  private _flushAt: number
  private _maxRetries: number
  private _url: string
  private _flushPendingItemsCount?: number
  private _httpRequestTimeout: number
  private _emitter: NodeEmitter
  private _disable: boolean
  private _httpClient: HTTPClient
  private _writeKey: string
  private _basicAuth: string
  private _tokenManager: TokenManager | undefined

  constructor(
    {
      host,
      path,
      maxRetries,
      flushAt,
      flushInterval,
      writeKey,
      httpRequestTimeout,
      httpClient,
      disable,
      oauthSettings,
    }: PublisherProps,
    emitter: NodeEmitter
  ) {
    this._emitter = emitter
    this._maxRetries = maxRetries
    this._flushAt = Math.max(flushAt, 1)
    this._flushInterval = flushInterval
    this._url = tryCreateFormattedUrl(
      host ?? 'https://api.segment.io',
      path ?? '/v1/batch'
    )
    this._httpRequestTimeout = httpRequestTimeout ?? 10000
    this._disable = Boolean(disable)
    this._httpClient = httpClient
    this._writeKey = writeKey
    this._basicAuth = b64encode(`${writeKey}:`)

    if (oauthSettings) {
      this._tokenManager = new TokenManager({
        ...oauthSettings,
        httpClient: oauthSettings.httpClient ?? httpClient,
        maxRetries: oauthSettings.maxRetries ?? maxRetries,
      })
    }
  }

  private createBatch(): ContextBatch {
    this.pendingFlushTimeout && clearTimeout(this.pendingFlushTimeout)
    const batch = new ContextBatch(this._flushAt)
    this._batch = batch
    this.pendingFlushTimeout = setTimeout(() => {
      if (batch === this._batch) {
        this._batch = undefined
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
    this._batch = undefined
  }

  flush(pendingItemsCount: number): void {
    if (!pendingItemsCount) {
      // if number of pending items is 0, there will never be anything else entering the batch, since the app is closed.
      if (this._tokenManager) {
        this._tokenManager.stopPoller()
      }
      return
    }

    this._flushPendingItemsCount = pendingItemsCount

    // if batch is empty, there's nothing to flush, and when things come in, enqueue will handle them.
    if (!this._batch) return

    // the number of globally pending items will always be larger or the same as batch size.
    // Any mismatch is because some globally pending items are in plugins.
    const isExpectingNoMoreItems = this._batch.length === pendingItemsCount
    if (isExpectingNoMoreItems) {
      this.send(this._batch)
        .catch(noop)
        .finally(() => {
          // stop poller so program can exit ().
          if (this._tokenManager) {
            this._tokenManager.stopPoller()
          }
        })
      this.clearBatch()
    }
  }

  /**
   * Enqueues the context for future delivery.
   * @param ctx - Context containing a Segment event.
   * @returns a promise that resolves with the context after the event has been delivered.
   */
  enqueue(ctx: Context): Promise<Context> {
    const batch = this._batch ?? this.createBatch()

    const { promise: ctxPromise, resolve } = createDeferred<Context>()

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
    const addStatus = batch.tryAdd(pendingItem)
    if (addStatus.success) {
      const isExpectingNoMoreItems =
        batch.length === this._flushPendingItemsCount
      const isFull = batch.length === this._flushAt
      if (isFull || isExpectingNoMoreItems) {
        this.send(batch).catch(noop)
        this.clearBatch()
      }
      return ctxPromise
    }

    // If the new item causes the maximimum event size to be exceeded, send the current batch and create a new one.
    if (batch.length) {
      this.send(batch).catch(noop)
      this.clearBatch()
    }

    const fallbackBatch = this.createBatch()

    const fbAddStatus = fallbackBatch.tryAdd(pendingItem)

    if (fbAddStatus.success) {
      const isExpectingNoMoreItems =
        fallbackBatch.length === this._flushPendingItemsCount
      if (isExpectingNoMoreItems) {
        this.send(fallbackBatch).catch(noop)
        this.clearBatch()
      }
      return ctxPromise
    } else {
      // this should only occur if max event size is exceeded
      ctx.setFailedDelivery({
        reason: new Error(fbAddStatus.message),
      })
      return Promise.resolve(ctx)
    }
  }

  private async send(batch: ContextBatch) {
    if (this._flushPendingItemsCount) {
      this._flushPendingItemsCount -= batch.length
    }
    const events = batch.getEvents()
    const maxRetries = this._maxRetries

    let countedRetries = 0
    let totalAttempts = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      totalAttempts++

      let requestedRetryTimeout: number | undefined
      let failureReason: unknown
      let shouldRetry = false
      let shouldCountTowardsMaxRetries = true
      try {
        if (this._disable) {
          return batch.resolveEvents()
        }

        let authString = undefined
        if (this._tokenManager) {
          const token = await this._tokenManager.getAccessToken()
          if (token && token.access_token) {
            authString = `Bearer ${token.access_token}`
          }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'analytics-node-next/latest',
          'X-Retry-Count': String(totalAttempts - 1),
          // Prefer OAuth Bearer token when available; otherwise fall back to Basic auth with write key.
          ...(authString
            ? { Authorization: authString }
            : { Authorization: `Basic ${this._basicAuth}` }),
        }

        const request: HTTPClientRequest = {
          url: this._url,
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            batch: events,
            writeKey: this._writeKey,
            sentAt: new Date(),
          }),
          httpRequestTimeout: this._httpRequestTimeout,
        }

        this._emitter.emit('http_request', {
          body: request.body,
          method: request.method,
          url: request.url,
          headers: request.headers,
        })

        const response = await this._httpClient.makeRequest(request)

        if (response.status >= 100 && response.status < 300) {
          // Successfully sent events, so exit!
          batch.resolveEvents()
          return
        } else if (
          this._tokenManager &&
          (response.status === 400 ||
            response.status === 401 ||
            response.status === 403 ||
            response.status === 511)
        ) {
          // Clear OAuth token if we have OAuth data
          this._tokenManager.clearToken()
        }

        const status = response.status
        const statusText = response.statusText

        // 400 is always non-retriable (malformed request / size exceeded)
        if (status === 400) {
          // https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/#max-request-size
          // Request either malformed or size exceeded - don't retry.
          resolveFailedBatch(batch, new Error(`[${status}] ${statusText}`))
          return
        }

        failureReason = new Error(`[${status}] ${statusText}`)

        // Retry-After based handling for specific status codes.
        if (status === 429 || status === 408 || status === 503) {
          const retryAfterSeconds = getRetryAfterInSeconds(response.headers)
          if (typeof retryAfterSeconds === 'number') {
            requestedRetryTimeout = retryAfterSeconds * 1000
            shouldRetry = true
            // These retries do not count against maxRetries
            shouldCountTowardsMaxRetries = false
          }
        }

        // If we haven't already decided to retry based on Retry-After,
        // apply the general retry policy.
        if (!shouldRetry) {
          if (status >= 500 && status < 600) {
            // Retry all 5xx except 501 and 505.
            // 511 is retried only when a token manager is configured.
            if (status === 511 && this._tokenManager) {
              shouldRetry = true
            } else if (![501, 505].includes(status)) {
              shouldRetry = true
            }
          } else if (status >= 400 && status < 500) {
            // 4xx are non-retriable except a specific allowlist.
            if ([408, 410, 429, 460].includes(status)) {
              shouldRetry = true
            } else {
              resolveFailedBatch(batch, failureReason)
              return
            }
          } else {
            // Treat other status codes as transient and retry.
            shouldRetry = true
          }
        }
      } catch (err) {
        // Network errors get thrown, retry them.
        failureReason = err
        shouldRetry = true
      }

      if (!shouldRetry) {
        resolveFailedBatch(batch, failureReason)
        return
      }

      if (shouldCountTowardsMaxRetries) {
        countedRetries++
        if (countedRetries > maxRetries) {
          resolveFailedBatch(batch, failureReason)
          return
        }
      }

      const delayMs =
        requestedRetryTimeout ??
        backoff({
          attempt: countedRetries,
          minTimeout: 100,
          maxTimeout: 60000,
        })

      await sleep(delayMs)
    }
  }
}

function resolveFailedBatch(batch: ContextBatch, reason: unknown) {
  batch.getContexts().forEach((ctx) => ctx.setFailedDelivery({ reason }))
  batch.resolveEvents()
}
