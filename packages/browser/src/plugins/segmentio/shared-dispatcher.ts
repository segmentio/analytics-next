export const createHeaders = (
  headerSettings: AdditionalHeaders | undefined
): Record<string, string> => {
  return {
    'Content-Type': 'text/plain',
    ...(typeof headerSettings === 'function'
      ? headerSettings()
      : headerSettings),
  }
}

/**
 * Additional headers to be sent with the request.
 * Default is `Content-Type: text/plain`. This can be overridden.
 * If a function is provided, it will be called before each request.
 */
export type AdditionalHeaders =
  | Record<string, string>
  | (() => Record<string, string>)

export type RequestPriority = 'high' | 'low' | 'auto'
export type RequestCredentials = 'include' | 'same-origin' | 'omit'

/**
 * These are the options that can be passed to the fetch dispatcher.
 * They more/less map to the Fetch RequestInit type.
 */
interface DispatchFetchConfig {
  /**
   * Request credentials configuration
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials
   */
  credentials?: RequestCredentials
  /**
   * This is useful for ensuring that an event is sent even if the user navigates away from the page.
   * However, it may increase the likelihood of events being lost, as there is a 64kb limit for *all* fetch requests (not just ones to segment) with keepalive (which is why it's disabled by default). So, if you're sending a lot of data, this will likely cause events to be dropped.

   * @default false
   */
  keepalive?: boolean
  /**
   * Additional headers to be sent with the request.
   * Default is `Content-Type: text/plain`. This can be overridden.
   * If a function is provided, it will be called before each request.
   * @example { 'Content-Type': 'application/json' } or () => { 'Content-Type': 'application/json' }
   */
  headers?: AdditionalHeaders
  /**
   * 'Request Priority' of the request
   * @see https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#priority
   */
  priority?: RequestPriority
}

export interface BatchingDispatchConfig extends DispatchFetchConfig {
  /**
   * If strategy = 'batching', the maximum number of events to send in a single request. If the batch reaches this size, a request will automatically be sent.
   *
   * @default 10
   */
  size?: number
  /**
   * If strategy = 'batching', the maximum time, in milliseconds, to wait before sending a request.
   * This won't alaways be relevant, as the request will be sent when the size is reached.
   * However, if the size is never reached, the request will be sent after this time.
   * When it comes to retries, if there is a rate limit timeout header, that will be respected over the value here.
   *
   * @default 5000
   */
  timeout?: number
  /**
   * If strategy = 'batching', the maximum number of retries to attempt before giving up.
   * @default 10
   */
  maxRetries?: number
}

export interface StandardDispatcherConfig extends DispatchFetchConfig {}

export type DeliveryStrategy =
  | {
      strategy?: 'standard'
      config: StandardDispatcherConfig
    }
  | {
      strategy: 'batching'
      config?: BatchingDispatchConfig
    }

// --- HTTP Config (rate limiting + backoff) ---

export interface RateLimitConfig {
  /** Enable rate-limit retry logic. When false, Retry-After headers are ignored. @default true */
  enabled?: boolean
  /** Max retry attempts for rate-limited requests. @default 100 */
  maxRetryCount?: number
  /** Max Retry-After interval the SDK will respect, in seconds. @default 300 */
  maxRetryInterval?: number
  /** Max total time (seconds) rate-limited retries can continue before dropping. @default 180 (3 minutes) */
  maxRateLimitDuration?: number
}

export interface BackoffConfig {
  /** Enable backoff retry logic for transient errors. When false, no exponential backoff is applied. @default true */
  enabled?: boolean
  /** Max retry attempts per batch. @default 100 */
  maxRetryCount?: number
  /** Initial backoff interval in seconds. @default 0.5 */
  baseBackoffInterval?: number
  /** Max backoff interval in seconds. @default 300 */
  maxBackoffInterval?: number
  /** Max total time (seconds) a batch can remain in retry before being dropped. @default 43200 (12 hours) */
  maxTotalBackoffDuration?: number
  /** Jitter percentage (0-100) added to backoff calculations to prevent thundering herd. @default 10 */
  jitterPercent?: number
  /** Default behavior for 4xx responses. @default "drop" */
  default4xxBehavior?: 'drop' | 'retry'
  /** Default behavior for 5xx responses. @default "retry" */
  default5xxBehavior?: 'drop' | 'retry'
  /** Per-status-code behavior overrides. Keys are HTTP status codes as strings. */
  statusCodeOverrides?: Record<string, 'drop' | 'retry'>
}

export interface HttpConfig {
  rateLimitConfig?: RateLimitConfig
  backoffConfig?: BackoffConfig
}

// --- Resolved types (all fields required, no undefined checks needed by consumers) ---

export interface ResolvedRateLimitConfig {
  enabled: boolean
  maxRetryCount: number
  maxRetryInterval: number
  maxRateLimitDuration: number
}

export interface ResolvedBackoffConfig {
  enabled: boolean
  maxRetryCount: number
  baseBackoffInterval: number
  maxBackoffInterval: number
  maxTotalBackoffDuration: number
  jitterPercent: number
  default4xxBehavior: 'drop' | 'retry'
  default5xxBehavior: 'drop' | 'retry'
  statusCodeOverrides: Record<string, 'drop' | 'retry'>
}

export interface ResolvedHttpConfig {
  rateLimitConfig: ResolvedRateLimitConfig
  backoffConfig: ResolvedBackoffConfig
}

// --- Default values ---

const DEFAULT_STATUS_CODE_OVERRIDES: Record<string, 'drop' | 'retry'> = {
  '408': 'retry',
  '410': 'retry',
  '429': 'retry',
  '460': 'retry',
  '501': 'drop',
  '505': 'drop',
  '511': 'drop',
}

/** Clamp a number to a range, returning the default if the value is undefined. */
function clamp(
  value: number | undefined,
  defaultValue: number,
  min: number,
  max: number
): number {
  const v = value ?? defaultValue
  return Math.min(Math.max(v, min), max)
}

/** Statuses eligible for Retry-After header handling. */
const RETRY_AFTER_STATUSES = [429, 408, 503]

/**
 * Parse the Retry-After header from a response, if present and applicable.
 * Returns `{ retryAfterMs, fromHeader }` when a valid delay is found, or `null` otherwise.
 */
export function parseRetryAfter(
  res: { status: number; headers?: { get(name: string): string | null } },
  rateLimitConfig: ResolvedRateLimitConfig
): { retryAfterMs: number; fromHeader: boolean } | null {
  if (!RETRY_AFTER_STATUSES.includes(res.status)) {
    return null
  }

  const raw = res.headers?.get('Retry-After')
  if (!raw) {
    return null
  }

  const parsed = parseInt(raw, 10)
  if (Number.isNaN(parsed)) {
    return null
  }

  const cappedSeconds = Math.max(
    0,
    Math.min(parsed, rateLimitConfig.maxRetryInterval)
  )
  return { retryAfterMs: cappedSeconds * 1000, fromHeader: true }
}

/**
 * Determine whether a given HTTP status code should cause a retry or a drop,
 * based on the resolved backoff configuration.
 */
export function getStatusBehavior(
  status: number,
  backoffConfig: ResolvedBackoffConfig
): 'drop' | 'retry' {
  const override = backoffConfig.statusCodeOverrides[String(status)]
  if (override) {
    return override
  }

  if (status >= 500) return backoffConfig.default5xxBehavior
  if (status >= 400) return backoffConfig.default4xxBehavior

  return 'drop'
}

/**
 * Compute an exponential backoff delay in milliseconds for the given attempt.
 * Attempt is 1-based (first retry = 1).
 */
export function computeBackoff(
  attempt: number,
  config: ResolvedBackoffConfig
): number {
  const baseMs = config.baseBackoffInterval * 1000
  const maxMs = config.maxBackoffInterval * 1000
  const exponential = baseMs * Math.pow(2, attempt - 1)
  const capped = Math.min(exponential, maxMs)
  const jitter = 1 + (Math.random() - 0.5) * 2 * (config.jitterPercent / 100)
  return Math.max(0, capped * jitter)
}

/**
 * Resolve an optional HttpConfig from CDN/user settings into a fully-populated
 * config object with defaults applied and values clamped to safe ranges.
 */
export function resolveHttpConfig(config?: HttpConfig): ResolvedHttpConfig {
  const rate = config?.rateLimitConfig
  const backoff = config?.backoffConfig

  return {
    rateLimitConfig: {
      enabled: rate?.enabled ?? true,
      maxRetryCount: rate?.maxRetryCount ?? 100,
      maxRetryInterval: clamp(rate?.maxRetryInterval, 300, 0.1, 86400),
      maxRateLimitDuration: clamp(rate?.maxRateLimitDuration, 180, 10, 86400),
    },
    backoffConfig: {
      enabled: backoff?.enabled ?? true,
      maxRetryCount: backoff?.maxRetryCount ?? 100,
      baseBackoffInterval: clamp(backoff?.baseBackoffInterval, 0.5, 0.1, 300),
      maxBackoffInterval: clamp(backoff?.maxBackoffInterval, 300, 0.1, 86400),
      maxTotalBackoffDuration: clamp(
        backoff?.maxTotalBackoffDuration,
        43200,
        60,
        604800
      ),
      jitterPercent: clamp(backoff?.jitterPercent, 10, 0, 100),
      default4xxBehavior: backoff?.default4xxBehavior ?? 'drop',
      default5xxBehavior: backoff?.default5xxBehavior ?? 'retry',
      statusCodeOverrides: {
        ...DEFAULT_STATUS_CODE_OVERRIDES,
        ...backoff?.statusCodeOverrides,
      },
    },
  }
}
