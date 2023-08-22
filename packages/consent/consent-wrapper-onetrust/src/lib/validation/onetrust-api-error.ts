/**
 * An Errot that represents that the OneTrust API is not in the expected format.
 * This is not something that could happen unless our API types are wrong and something is very wonky.
 * Not a recoverable error.
 */
export class OneTrustApiValidationError extends Error {
  name = 'OtConsentWrapperValidationError'
  constructor(message: string, received: any) {
    super(`Invariant: ${message} (Received: ${JSON.stringify(received)})`)
  }
}
