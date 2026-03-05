export class RateLimitError extends Error {
  retryTimeout: number
  isRetryableWithoutCount: boolean

  constructor(
    message: string,
    retryTimeout: number,
    isRetryableWithoutCount = false
  ) {
    super(message)
    this.retryTimeout = retryTimeout
    this.isRetryableWithoutCount = isRetryableWithoutCount
    this.name = 'RateLimitError'
  }
}
