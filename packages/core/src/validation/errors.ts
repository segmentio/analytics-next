export class ValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}
