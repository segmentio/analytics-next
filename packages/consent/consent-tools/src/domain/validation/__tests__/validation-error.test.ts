import { ValidationError } from '../validation-error'

describe(ValidationError, () => {
  it('should have the correct shape', () => {
    const err = new ValidationError('foo', 'bar')

    expect(err).toBeInstanceOf(Error)

    expect(err.name).toBe('ValidationError')

    expect(err.message).toMatchInlineSnapshot(
      `"[Validation] foo (Received: \\"bar\\")"`
    )
  })
})
