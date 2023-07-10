import { validateCategories, validateOptions } from '../options-validators'
import { ValidationError } from '../validation-error'

describe(validateOptions, () => {
  it('should throw if options is not a plain object', () => {
    expect(() => validateOptions(null as any)).toThrow()
    expect(() => validateOptions(undefined as any)).toThrow()
    expect(() => validateOptions('hello' as any)).toThrow()
  })

  it('should throw an instance of ValidationError', () => {
    expect(() => validateOptions(null as any)).toThrowError(ValidationError)
  })

  it('should throw with the expected error', () => {
    expect(() =>
      validateOptions(null as any)
    ).toThrowErrorMatchingInlineSnapshot(
      `"[Validation] Options should be an object (Received: null)"`
    )
  })

  it('should throw if required property(s) are not included', () => {
    expect(() => validateOptions({} as any)).toThrow()
  })

  it('should throw if getCategories() is not a function', () => {
    expect(() =>
      validateOptions({
        getCategories: {},
      })
    ).toThrow()
  })
})

describe(validateCategories, () => {
  it('should throw if categories is not a plain object', () => {
    expect(() => validateCategories(null)).toThrow()
    expect(() => validateCategories(undefined)).toThrow()
    expect(() => validateCategories('hello')).toThrow()
  })

  it('should throw an instance of ValidationError', () => {
    expect(() => validateCategories(null)).toThrow(ValidationError)
  })

  it('should throw with the expected error', () => {
    expect(() => validateCategories(null)).toThrowErrorMatchingInlineSnapshot(
      `"[Validation] Consent Categories should be {[categoryName: string]: boolean} (Received: null)"`
    )
  })

  it('should throw if categories does not match {categoryName: boolean}', () => {
    expect(() => validateCategories({})).not.toThrow() // if getCategories is empty object, it is the same as 'consent to all categories' if false
    expect(() => validateCategories({ a: true })).not.toThrow()
    expect(() => validateCategories({ a: 'foo' })).toThrow()
    expect(() => validateCategories({ a: 'true' })).toThrow()
    expect(() => validateCategories({ a: true, b: 'foo' })).toThrow()
    expect(() => validateCategories({ a: true, b: 'foo', c: true })).toThrow()
  })
})
