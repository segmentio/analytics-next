import { CDNSettingsConsent } from '../../types'
import { segmentShouldBeDisabled } from '../blocking-helpers'

describe('segmentShouldBeDisabled', () => {
  it('should be disabled if user has only consented to irrelevant categories: multiple', () => {
    const consentCategories = { foo: true, bar: true, baz: false }
    const consentSettings: CDNSettingsConsent = {
      allCategories: ['baz', 'qux'],
      hasUnmappedDestinations: false,
    }
    expect(segmentShouldBeDisabled(consentCategories, consentSettings)).toBe(
      true
    )
  })

  it('should be disabled if user has only consented to irrelevant categories: single', () => {
    const consentCategories = { foo: true }
    const consentSettings = {
      allCategories: ['bar'],
      hasUnmappedDestinations: false,
    }
    expect(segmentShouldBeDisabled(consentCategories, consentSettings)).toBe(
      true
    )
  })

  it('should be enabled if there are any relevant categories consented to', () => {
    const consentCategories = { foo: true, bar: true, baz: true }
    const consentSettings: CDNSettingsConsent = {
      allCategories: ['baz'],
      hasUnmappedDestinations: false,
    }
    expect(segmentShouldBeDisabled(consentCategories, consentSettings)).toBe(
      false
    )
  })

  it('should be enabled if consentSettings is undefined', () => {
    const consentCategories = { foo: true }
    const consentSettings = undefined
    expect(segmentShouldBeDisabled(consentCategories, consentSettings)).toBe(
      false
    )
  })

  it('should be enabled if consentSettings has unmapped destinations', () => {
    const consentCategories = { foo: true }
    const consentSettings = {
      allCategories: ['foo'],
      hasUnmappedDestinations: true,
    }
    expect(segmentShouldBeDisabled(consentCategories, consentSettings)).toBe(
      false
    )
  })

  it('should be enabled if user has consented to all relevant categories', () => {
    const consentCategories = { foo: true }
    const consentSettings = {
      allCategories: ['foo'],
      hasUnmappedDestinations: false,
    }
    expect(segmentShouldBeDisabled(consentCategories, consentSettings)).toBe(
      false
    )
  })
})
