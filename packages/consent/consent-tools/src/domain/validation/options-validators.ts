import { Categories, CreateWrapperSettings } from '../../types'
import { assertIsFunction, assertIsObject } from './common-validators'
import { ValidationError } from './validation-error'

export function validateCategories(
  ctgs: unknown
): asserts ctgs is NonNullable<Categories> {
  if (ctgs && typeof ctgs === 'object' && !Array.isArray(ctgs)) {
    for (const k in ctgs) {
      if (typeof (ctgs as any)[k] === 'boolean') {
        return
      }
    }
  }
  throw new ValidationError(
    `Consent Categories should be {[categoryName: string]: boolean}`,
    ctgs
  )
}

export function validateOptions(options: {
  [k in keyof CreateWrapperSettings]: unknown
}): asserts options is CreateWrapperSettings {
  if (typeof options !== 'object' || !options) {
    throw new ValidationError('Options should be an object', options)
  }

  assertIsFunction(options.getCategories, 'getCategories')

  options.shouldLoad && assertIsFunction(options.shouldLoad, 'shouldLoad')

  options.disableConsentRequirement &&
    assertIsFunction(
      options.disableConsentRequirement,
      'disableConsentRequirement'
    )

  options.registerConsentChanged &&
    assertIsFunction(options.registerConsentChanged, 'registerConsentChanged')

  options.shouldEnableIntegration &&
    assertIsFunction(options.shouldEnableIntegration, 'shouldEnableIntegration')

  options.disableSegmentInitialization &&
    assertIsFunction(
      options.disableSegmentInitialization,
      'disableSegmentInitialization'
    )

  options.integrationCategoryMappings &&
    assertIsObject(
      options.integrationCategoryMappings,
      'integrationCategoryMappings'
    )
}
