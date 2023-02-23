import { LegacySettings } from '../..'
import { createSuccess } from '../factories'
import { cdnSettingsMinimal } from './cdn-settings'

export const createMockFetchImplementation = (
  cdnSettings: Partial<LegacySettings> = {}
) => {
  return (url: RequestInfo, req?: RequestInit) => {
    return true
  }
}
