import { chromium, ChromiumBrowserContext } from 'playwright'
import fs from 'fs-extra'
import path from 'path'
// import { sortBy } from 'lodash'
import {
  AJS_VERSION,
  HEADLESS,
  DEVTOOLS,
  TRACKING_API_URLS,
  cases,
  ENDPOINTS,
} from './config'
import { startLocalServer } from './localServer'
import { Request } from 'playwright'

interface APICalls {
  name: string
  trackingAPI: Call[]
}

interface Call {
  url: string
  headers: Object
  postData: Object | null
}

async function loadAJSNext(context: ChromiumBrowserContext): Promise<void> {
  const url = await startLocalServer()

  await context.route(`**/analytics.min.js`, (route) => {
    route.fulfill({
      status: 301,
      headers: {
        Location: `${url}/dist/umd/standalone.js`,
      },
    })
  })
}

async function writeJSONFile(apiCalls: APICalls) {
  const filePath = path.join(
    __dirname,
    '../data/requests/',
    `${AJS_VERSION}-${apiCalls.name}.json`
  )

  await fs.writeFile(filePath, JSON.stringify(apiCalls))

  console.log(
    `\nDigest for ${apiCalls.name}:\n`,
    apiCalls.trackingAPI.filter((request) => request.url.includes('v1/p'))
      .length,
    'Page calls \n',
    apiCalls.trackingAPI.filter((request) => request.url.includes('v1/t'))
      .length,
    'Track calls \n',
    apiCalls.trackingAPI.filter((request) => request.url.includes('v1/i'))
      .length,
    'Identify calls \n',
    apiCalls.trackingAPI.filter((request) => request.url.includes('v1/a'))
      .length,
    'Alias calls \n',
    apiCalls.trackingAPI.filter((request) => request.url.includes('v1/g'))
      .length,
    'Group calls \n',
    apiCalls.trackingAPI.length,
    'saved into',
    filePath
  )
}

async function record() {
  const promises = cases.map(async (c) => {
    const browser = await chromium.launch({
      headless: HEADLESS === 'true',
      // 2500 is the magic number that allows for navigation to wait for AJS
      // calls to be actually fired
      slowMo: 2500,
      devtools: DEVTOOLS,
    })

    const context = await browser.newContext({
      bypassCSP: true,
      // the HAR files recorded below require a much bigger clean up process than the JSONs we're manually recording.
      // We'll have to get back to this in the future and write a proper clean up script.
      // recordHar: {
      //   path: path.join(__dirname, 'data/requests/har', `${AJS_VERSION}-${c.name}`),
      // },
    })

    if (AJS_VERSION === 'next') {
      // one thing worth investigating is if we can replace `loadAJSNext` with page.addInitScript(script)
      await loadAJSNext(context)
    }

    const apiCalls: APICalls = { name: c.name, trackingAPI: [] }

    // Open new page
    const page = await context.newPage()

    await page.setViewportSize({ width: 1200, height: 800 })

    page.on('request', (request: Request) => {
      if (TRACKING_API_URLS.some((k) => request.url().includes(k))) {
        if (ENDPOINTS.some((e) => request.url().includes(e))) {
          console.log(request.url())

          const postData: any = request.postDataJSON()

          const call = {
            url: request.url(),
            postData: {
              type: postData!.type,
              context: postData!.context,
              properties: postData!.properties,
              integrations: postData!.integrations,
              _metadata: postData!._metadata,
            },
            headers: request.headers(),
          }

          apiCalls.trackingAPI.push(call)
        }
      }
    })

    await c.scenario(page)

    // Close page
    // ---------------------
    await page.close()

    await context.close()
    await browser.close()

    // Save requests
    await writeJSONFile(apiCalls)
  })

  await Promise.all(promises)
}

record().catch((err) => {
  console.error(err)
  process.exit(1)
})
