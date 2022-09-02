type BackoffParams = {
  /** The number of milliseconds before starting the first retry. Default is 500 */
  minTimeout?: number

  /** The maximum number of milliseconds between two retries. Default is Infinity */
  maxTimeout?: number

  /** The exponential factor to use. Default is 2. */
  factor?: number

  /** The current attempt */
  attempt: number

  /* an optional multiplier -- typically between 0 and 1 */
  rand?: number
}

export function backoff(params: BackoffParams): number {
  const random = (params.rand ?? Math.random()) + 1
  const {
    minTimeout = 500,
    factor = 2,
    attempt,
    maxTimeout = Infinity,
  } = params
  return Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
}

/**
 *
 * @returns Max total retry time in MS
 */
export const calculateMaxTotalRetryTime = (maxAttempts: number): number => {
  let retryTime = 0
  for (let i = maxAttempts; i > 0; i--) {
    retryTime += backoff({ attempt: i, rand: 1 })
  }
  return retryTime
}
