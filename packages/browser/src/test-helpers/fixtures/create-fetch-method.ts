import { LegacySettings } from '../..'
import { createSuccess } from '../factories'
import { cdnSettingsMinimal } from './cdn-settings'

export const createMockFetchImplementation = (
  cdnSettings: Partial<LegacySettings> = {}
) => {
  return (...[url, req]: Parameters<typeof fetch>) => {
    const reqUrl = url.toString()
    if (!req || (req.method === 'get' && reqUrl.includes('cdp.customer.io'))) {
      // GET https://cdp.customer.io/v1/projects/{writeKey}
      return createSuccess({ ...cdnSettingsMinimal, ...cdnSettings })
    }

    if (req?.method === 'post' && reqUrl.includes('cdp.customer.io')) {
      // POST https://cdp.customer.io/v1/{event.type}
      return createSuccess({ success: true }, { status: 201 })
    }

    throw new Error(
      `no match found for request (url:${url}, req:${JSON.stringify(req)})`
    )
  }
}
