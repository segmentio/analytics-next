import { Request, Page } from 'playwright'
import path from 'path'
import ajsTester from '../cases/custom-site'
import fs from 'fs-extra'
import { WRITE_KEYS } from './config'
import { navigate } from '.'

async function writeJSONFile(content: any, name: string) {
  const filePath = path.join(__dirname, '../data/requests/', `${name}.json`)

  await fs.writeFile(filePath, JSON.stringify(content))
}

function recordCalls(page: Page, networkRequests: any[]) {
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
        integrations,
        cookies,
        networkRequests: networkRequests.filter(Boolean),
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
