import { CreateWrapperSettings } from '../../../types'
import { validateCategories, validateSettings } from '../options-validators'
import { ValidationError } from '../validation-error'

const DEFAULT_OPTIONS: CreateWrapperSettings = {
  getCategories: () => ({}),
}

describe(validateSettings, () => {
  it('should throw if options is not a plain object', () => {
    expect(() => validateSettings(null as any)).toThrow()
    expect(() => validateSettings(undefined as any)).toThrow()
    expect(() => validateSettings('hello' as any)).toThrow()
  })

  it('should throw an instance of ValidationError', () => {
    expect(() => validateSettings(null as any)).toThrowError(ValidationError)
  })

  it('should throw with the expected error', () => {
    expect(() =>
      validateSettings(null as any)
    ).toThrowErrorMatchingInlineSnapshot(
      `"[Validation] Options should be an object (Received: null)"`
    )
  })

  it('should throw if required property(s) are not included', () => {
    expect(() => validateSettings({} as any)).toThrow()
  })

  it('should throw if getCategories() is not a function', () => {
    expect(() =>
      validateSettings({
        getCategories: {},
      })
    ).toThrow()
  })

  it('should throw if registerOnChanged() is not a function', () => {
    expect(() =>
      validateSettings({
        ...DEFAULT_OPTIONS,
        registerOnConsentChanged: {} as any,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"[Validation] registerOnConsentChanged is not a function (Received: {})"`
    )
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
