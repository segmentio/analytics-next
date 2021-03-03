import { Request, Page } from 'playwright'
import path from 'path'
import ajsTester from '../cases/custom-site'
import fs from 'fs-extra'
import { TRACKING_API_URLS, WRITE_KEYS } from './config'
import { navigate } from '.'
import { sortBy } from 'lodash'
import { JSONRequests, NetworkRequest } from './types'

async function writeJSONFile(content: JSONRequests, name: string) {
  const filePath = path.join(__dirname, '../data/requests/', `${name}.json`)

  await fs.writeFile(filePath, JSON.stringify(content))
}

export function recordCalls(page: Page, networkRequests: NetworkRequest[]) {
  page.on('request', (request: Request) => {
    if (TRACKING_API_URLS.some((k) => request.url().includes(k))) {
      try {
        const postData: any = request.postDataJSON()

        const call: NetworkRequest = {
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
      } catch (e) {
        console.warn(`Couldn't parse request ${request.url()}`)
      }
    }
  })
}

async function recordAJSTester(version: string) {
  const promises = WRITE_KEYS.map(async (writeKey) => {
    const { networkRequests, cookies, integrations } = await navigate({
      c: ajsTester,
      recordCallsFunc: recordCalls,
      version,
      writeKey,
    })

    await writeJSONFile(
      {
        integrations: integrations.sort(),
        cookies: sortBy(cookies, 'name'),
        networkRequests: sortBy(
          networkRequests.filter(
            (n) =>
              Boolean(n) &&
              typeof n !== 'string' &&
              !n.url.includes('localhost') && // Next only: calls to localhost to fetch AJSN bundle
              !n.url.includes('cdn-settings.segment.com') && // Next only: calls to fetch integrations settings
              !n.url.includes('next-integrations') && // Next only: calls to fetch integrations bundles
              !n.url.includes('cdn.segment.com/analytics.js/v1') // Classic only: calls to fetch AJS from cdn
          ),
          'url'
        ),
      },
      `ajs-tester-${writeKey}-${version}`
    )
  })

  await Promise.all(promises)
}

recordAJSTester('classic').catch((err) => {
  console.error(err)
  process.exit(1)
})

recordAJSTester('next').catch((err) => {
  console.error(err)
  process.exit(1)
})
