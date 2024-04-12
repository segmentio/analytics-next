import { OtConsentModel } from '../lib/onetrust-api'

export const isOptInConsentModel = (model: OtConsentModel): boolean => {
  switch (model) {
    case OtConsentModel.optIn:
    case OtConsentModel.implicit:
      return true
    case OtConsentModel.optOut:
    case OtConsentModel.custom:
    case OtConsentModel.notice:
      return false
    default:
      return false
  }
}
