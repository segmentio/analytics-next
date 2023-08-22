import { AnalyticsConsentError } from '../../types/errors'

export class ValidationError extends AnalyticsConsentError {
  constructor(message: string, received?: any) {
    if (arguments.length === 2) {
      // to ensure that explicitly passing undefined as second argument still works
      message += `(Received: ${JSON.stringify(received)})`
    }
    super('ValidationError', `[Validation] ${message}`)
  }
}
