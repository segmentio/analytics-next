type BackoffParams = {
  /** The number of milliseconds before starting the first retry. Default is 100 */
  minTimeout?: number

  /** The maximum number of milliseconds between two retries. Default is 60000 (1 minute) */
  maxTimeout?: number

  /** The exponential factor to use. Default is 2. */
  factor?: number

  /** The current attempt */
  attempt: number
}

export function backoff(params: BackoffParams): number {
  const random = Math.random() + 1
  const { minTimeout = 100, factor = 2, attempt, maxTimeout = 60000 } = params
  return Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
}
