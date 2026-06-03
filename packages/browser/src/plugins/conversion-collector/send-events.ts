import type {
  AnalyticsEventEnvelope,
  ConversionCollectorSettings,
} from './types'

export type CollectSendConfig = Pick<
  ConversionCollectorSettings,
  'endpoint' | 'headers' | 'retryAttempts'
>

export interface SendEventsOptions {
  /** Use sendBeacon / fetch keepalive for unload-sensitive delivery. */
  unload?: boolean
}

export class CollectNonRetryableError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'CollectNonRetryableError'
    this.status = status
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

function buildCollectBody(events: AnalyticsEventEnvelope[]): string {
  const sentAt = new Date().toISOString()
  return JSON.stringify({
    events: events.map((event) => ({
      ...event,
      sent_at: sentAt,
    })),
  })
}

function sendViaBeacon(endpoint: string, body: string): boolean {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.sendBeacon !== 'function'
  ) {
    return false
  }
  const blob = new Blob([body], { type: 'application/json' })
  return navigator.sendBeacon(endpoint, blob)
}

async function sendViaFetch(
  endpoint: string,
  body: string,
  headers: Record<string, string> | undefined,
  unload: boolean
): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
    keepalive: unload,
  })
}

async function deliverOnce(
  body: string,
  config: CollectSendConfig,
  unload: boolean
): Promise<void> {
  if (unload && sendViaBeacon(config.endpoint, body)) {
    return
  }

  const response = await sendViaFetch(
    config.endpoint,
    body,
    config.headers,
    unload
  )

  if (response.ok) {
    return
  }

  const status = response.status

  if (status >= 400 && status < 500 && status !== 429) {
    throw new CollectNonRetryableError(
      status,
      `Collect failed with non-retryable status ${status}`
    )
  }

  if (status === 429) {
    const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'))
    const err = new Error('Collect rate limited (429)') as Error & {
      retryAfterMs?: number
    }
    err.retryAfterMs = retryAfterMs
    throw err
  }

  throw new Error(`Collect failed with status ${status}`)
}

export async function sendEventsToCollect(
  events: AnalyticsEventEnvelope[],
  config: CollectSendConfig,
  options: SendEventsOptions = {}
): Promise<void> {
  const body = buildCollectBody(events)
  const unload = options.unload === true
  const retryAttempts = config.retryAttempts ?? 2
  let attempt = 0
  let lastError: unknown

  while (attempt <= retryAttempts) {
    try {
      await deliverOnce(body, config, unload)
      return
    } catch (error) {
      lastError = error
      if (error instanceof CollectNonRetryableError) {
        throw error
      }

      if (attempt >= retryAttempts) {
        break
      }

      const retryAfterMs =
        error instanceof Error &&
        'retryAfterMs' in error &&
        typeof (error as { retryAfterMs?: number }).retryAfterMs === 'number'
          ? (error as { retryAfterMs: number }).retryAfterMs
          : undefined

      await wait(retryAfterMs ?? Math.min(1500, 200 * 2 ** attempt))
      attempt += 1
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Collect request failed')
}
