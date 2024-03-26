import { LegacySettings } from '../..'
import { createSuccess } from '../factories'
import { cdnSettingsMinimal } from './cdn-settings'

export const createMockFetchImplementation = (
  cdnSettings: Partial<LegacySettings> = cdnSettingsMinimal
) => {
  return (...[url, req]: Parameters<typeof fetch>) => {
    const reqUrl = url.toString()
    const reqMethod = req?.method?.toLowerCase()
    if (!req || (reqMethod === 'get' && reqUrl.includes('cdn.segment.com'))) {
      // GET https://cdn.segment.com/v1/projects/{writeKey}
      return createSuccess({ ...cdnSettingsMinimal, ...cdnSettings })
    }

    if (reqMethod === 'post' && reqUrl.includes('api.segment.io')) {
      // POST https://api.segment.io/v1/{event.type}
      return createSuccess({ success: true }, { status: 201 })
    }

    if (reqMethod === 'post' && reqUrl.endsWith('/m')) {
      // POST https://api.segment.io/m
      return createSuccess({ success: true })
    }

    throw new Error(
      `no match found for request (url:${url}, req:${JSON.stringify(req)})`
    )
  }
}
