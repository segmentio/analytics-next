import { Categories, CreateWrapperSettings } from '../../types'
import { assertIsFunction, assertIsObject } from './common-validators'
import { ValidationError } from './validation-error'

export function validateCategories(
  ctgs: unknown
): asserts ctgs is NonNullable<Categories> {
  let hasError = true
  if (ctgs && typeof ctgs === 'object' && !Array.isArray(ctgs)) {
    hasError = false
    for (const k in ctgs) {
      if (typeof (ctgs as any)[k] !== 'boolean') {
        hasError = true
        break
      }
    }
  }
  if (hasError) {
    throw new ValidationError(
      `Consent Categories should be {[categoryName: string]: boolean}`,
      ctgs
    )
  }
}

export function validateOptions(options: {
  [k in keyof CreateWrapperSettings]: unknown
}): asserts options is CreateWrapperSettings {
  if (typeof options !== 'object' || !options) {
    throw new ValidationError('Options should be an object', options)
  }

  assertIsFunction(options.getCategories, 'getCategories')

  options.shouldLoad && assertIsFunction(options.shouldLoad, 'shouldLoad')

  options.shouldDisableConsentRequirement &&
    assertIsFunction(
      options.shouldDisableConsentRequirement,
      'shouldDisableConsentRequirement'
    )

  options.shouldEnableIntegration &&
    assertIsFunction(options.shouldEnableIntegration, 'shouldEnableIntegration')

  options.shouldDisableSegment &&
    assertIsFunction(options.shouldDisableSegment, 'shouldDisableSegment')

  options.integrationCategoryMappings &&
    assertIsObject(
      options.integrationCategoryMappings,
      'integrationCategoryMappings'
    )
}
