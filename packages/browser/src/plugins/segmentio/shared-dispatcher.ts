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

export type FetchPriority = 'high' | 'low' | 'auto'

interface DispatchConfig {
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
  additionalHeaders?: AdditionalHeaders
  /**
   * 'Fetch Priority' of the request (chrome-only).
   */
  fetchPriority?: FetchPriority
}

export interface BatchingDispatchConfig extends DispatchConfig {
  size?: number
  timeout?: number
  maxRetries?: number
}

export interface StandardDispatcherConfig extends DispatchConfig {}

export type DeliveryStrategy =
  | {
      strategy?: 'standard'
      config?: StandardDispatcherConfig
    }
  | {
      strategy?: 'batching'
      config?: BatchingDispatchConfig
    }
