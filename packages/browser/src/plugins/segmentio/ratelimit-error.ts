export class RateLimitError extends Error {
  retryTimeout: number

  constructor(message: string, retryTimeout: number) {
    super(message)
    this.retryTimeout = retryTimeout
    this.name = 'RateLimitError'
  }
}
