import { ConsentModel } from '@segment/analytics-consent-tools'
import { OtConsentModel } from '../lib/onetrust-api'

/**
 *  We don't support all consent models, so we need to coerce them to the ones we do support.
 */
export const coerceConsentModel = (model: OtConsentModel): ConsentModel => {
  switch (model) {
    case OtConsentModel.optIn:
    case OtConsentModel.implicit:
      return 'opt-in'
    case OtConsentModel.optOut:
      return 'opt-out'
    default: // there are some others like 'custom' / 'notice' that should be treated as 'opt-out'
      return 'opt-out'
  }
}
