export class ValidationError extends Error {
  constructor(message: string, received: any) {
    super(
      `[Validation] ${message} (${`Received: ${JSON.stringify(received)})`}`
    )
  }
}
