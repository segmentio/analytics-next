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
    case OtConsentModel.custom:
    case OtConsentModel.notice:
      return 'opt-out'
    default:
      return 'opt-out'
  }
}
