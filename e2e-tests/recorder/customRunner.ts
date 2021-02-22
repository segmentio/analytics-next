import { Request, Page } from 'playwright'
import path from 'path'
import ajsTester from '../cases/custom-site'
import fs from 'fs-extra'
import { WRITE_KEYS } from './config'
import { navigate } from '.'
import { sortBy } from 'lodash'
import { JSONRequests, NetworkRequest } from '../request-comparison/types'

async function writeJSONFile(content: JSONRequests, name: string) {
  const filePath = path.join(__dirname, '../data/requests/', `${name}.json`)

  await fs.writeFile(filePath, JSON.stringify(content))
}

function recordCalls(page: Page, networkRequests: NetworkRequest[]) {
  page.on('request', (request: Request) => {
    try {
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
    } catch (_e) {
      networkRequests.push(request.postData())
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
