import { Page } from 'playwright'
import { AJS_VERSION, TRACKING_API_URLS, cases, ENDPOINTS } from './config'
import { Request } from 'playwright'
import { navigate, writeJSONFile } from '.'
import { NetworkRequest } from '../request-comparison/types'

export function recordTrackingAPICalls(
  page: Page,
  networkRequests: NetworkRequest[]
) {
  page.on('request', (request: Request) => {
    if (TRACKING_API_URLS.some((k) => request.url().includes(k))) {
      if (ENDPOINTS.some((e) => request.url().includes(e))) {
        const postData: any = request.postDataJSON()

        const call = {
          url: request.url(),
          postData: {
            type: postData?.type ?? '',
            context: postData?.context ?? {},
            properties: postData?.properties ?? {},
            integrations: postData?.integrations ?? {},
            _metadata: postData?._metadata ?? {},
          },
          headers: request.headers(),
        }
        networkRequests.push(call)
      }
    }
  })
}

async function record(version: string) {
  const promises = cases.map(async (c) => {
    const { networkRequests, cookies, integrations = [] } = await navigate({
      c,
      recordCallsFunc: recordTrackingAPICalls,
      version,
    })

    await writeJSONFile(
      { networkRequests, cookies, integrations },
      `${c.name}-${version}`
    )
  })

  await Promise.all(promises)
}

record(AJS_VERSION).catch((err) => {
  console.error(err)
  process.exit(1)
})
