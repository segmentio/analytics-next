import { AnalyticsConsentError } from '../../types/errors'

export class ValidationError extends AnalyticsConsentError {
  constructor(message: string, received: any) {
    super(
      'ValidationError',
      `[Validation] ${message} (${`Received: ${JSON.stringify(received)})`}`
    )
  }
}
