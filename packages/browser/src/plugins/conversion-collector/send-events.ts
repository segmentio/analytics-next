import type { CollectEvent, ConversionCollectorSettings } from './types'

export type CollectSendConfig = Pick<
  ConversionCollectorSettings,
  'endpoint' | 'headers' | 'retryAttempts'
>

export type CollectTransportOptions = {
  keepalive?: boolean
}

const BASE_RETRY_MS = 1000
const MAX_RETRY_MS = 30_000
const MAX_RETRY_ATTEMPTS = 3
/** sendBeacon payload limit (conservative). */
export const BEACON_PAYLOAD_LIMIT_BYTES = 64 * 1024

export class CollectDeliveryError extends Error {
  readonly retryable: boolean
  readonly retryAfterMs?: number

  constructor(message: string, retryable: boolean, retryAfterMs?: number) {
    super(message)
    this.name = 'CollectDeliveryError'
    Object.setPrototypeOf(this, new.target.prototype)
    this.retryable = retryable
    this.retryAfterMs = retryAfterMs
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) {
    return undefined
  }
  const seconds = Number(header)
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return seconds * 1000
  }
  const dateMs = Date.parse(header)
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now())
  }
  return undefined
}

/**
 * x-ratelimit-reset from our collector:
 * - >= 1e12: Unix epoch in milliseconds
 * - >= 1e9:  Unix epoch in seconds
 * - otherwise: delay in seconds until reset
 */
function parseRateLimitResetMs(header: string | null): number | undefined {
  if (!header) {
    return undefined
  }
  const value = Number(header)
  if (Number.isNaN(value) || value <= 0) {
    return undefined
  }
  if (value >= 1_000_000_000_000) {
    return Math.max(0, value - Date.now())
  }
  if (value >= 1_000_000_000) {
    return Math.max(0, value * 1000 - Date.now())
  }
  return value * 1000
}

function classifyHttpFailure(
  status: number,
  headers?: Headers
): { retryable: boolean; retryAfterMs?: number } {
  if (status === 429) {
    return {
      retryable: true,
      retryAfterMs:
        parseRetryAfterMs(headers?.get('Retry-After') ?? null) ??
        parseRateLimitResetMs(headers?.get('x-ratelimit-reset') ?? null),
    }
  }
  if (status >= 500) {
    return { retryable: true }
  }
  if (status >= 400) {
    return { retryable: false }
  }
  return { retryable: false }
}

export function buildCollectRequestBody(events: CollectEvent[]): string {
  const sentAt = new Date().toISOString()
  return JSON.stringify(
    events.map((event) => {
      const retryCount = event._retryCount ?? event._metadata?.retryCount ?? 0
      const { _retryCount: _rc, ...rest } = event
      return {
        ...rest,
        sentAt,
        _metadata: {
          ...(typeof rest._metadata === 'object' && rest._metadata
            ? rest._metadata
            : {}),
          retryCount,
        },
      }
    })
  )
}

export function sendCollectViaBeacon(endpoint: string, body: string): boolean {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.sendBeacon !== 'function'
  ) {
    return false
  }
  if (body.length > BEACON_PAYLOAD_LIMIT_BYTES) {
    return false
  }
  const blob = new Blob([body], { type: 'application/json' })
  return navigator.sendBeacon(endpoint, blob)
}

export async function deliverCollectPayload(
  body: string,
  config: CollectSendConfig,
  transport: CollectTransportOptions = {}
): Promise<void> {
  let response: Response
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body,
      keepalive: transport.keepalive === true,
    })
  } catch (error) {
    throw new CollectDeliveryError(
      error instanceof Error ? error.message : 'Collect network error',
      true
    )
  }

  if (response.ok) {
    return
  }

  const { retryable, retryAfterMs } = classifyHttpFailure(
    response.status,
    response.headers
  )
  throw new CollectDeliveryError(
    `Collect failed with status ${response.status}`,
    retryable,
    retryAfterMs
  )
}

function computeBackoffMs(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs != null) {
    return Math.min(retryAfterMs, MAX_RETRY_MS)
  }
  const exponential = Math.min(
    BASE_RETRY_MS * 2 ** attempt + Math.random() * 1000,
    MAX_RETRY_MS
  )
  return exponential
}

export async function sendEventsToCollect(
  events: CollectEvent[],
  config: CollectSendConfig,
  transport: CollectTransportOptions = {}
): Promise<void> {
  if (events.length === 0) {
    return
  }

  const body = buildCollectRequestBody(events)
  const maxAttempts = Math.min(
    config.retryAttempts ?? 2,
    MAX_RETRY_ATTEMPTS - 1
  )
  let attempt = 0
  let lastError: unknown

  while (attempt <= maxAttempts) {
    try {
      await deliverCollectPayload(body, config, transport)
      return
    } catch (error) {
      lastError = error
      const deliveryError =
        error instanceof CollectDeliveryError
          ? error
          : new CollectDeliveryError(String(error), true)

      if (!deliveryError.retryable || attempt >= maxAttempts) {
        throw deliveryError
      }

      console.warn(
        `[utua] collect retry ${attempt + 1}/${maxAttempts + 1}:`,
        deliveryError.message
      )

      await wait(computeBackoffMs(attempt, deliveryError.retryAfterMs))
    } finally {
      attempt += 1
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new CollectDeliveryError('Collect request failed', true)
}
