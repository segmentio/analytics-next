import { chromium, ChromiumBrowserContext } from 'playwright'
import fs from 'fs'
import path from 'path'
// import segment from './cases/segment'
// import milanuncions from './cases/milanuncios'
// import staples from './cases/staples'
import local from './cases/local'

const cases = [local]

const AJS_VERSION = process.env.AJS_VERSION || 'next'
const HEADLESS = process.env.HEADLESS || 'true'
const URL_KEYWORDS = ['https://api.segment.io', 'https://api.segment.com', 'https://api.cd.segment.com', 'https://api.cd.segment.io']

interface APICalls {
  name: string
  trackingAPI: Call[]
}

interface Call {
  method: string
  url: string
  headers: Object
  postData: Object | null
}

async function loadAJSNext(context: ChromiumBrowserContext): Promise<void> {
  await context.route(`**/analytics.min.js`, (route) => {
    route.fulfill({
      status: 301,
      headers: {
        Location: 'http://localhost:5000/dist/umd/standalone.js',
      },
    })
  })
}

function writeJSONFile(apiCalls: APICalls) {
  const filePath = path.join(__dirname, 'data/requests/', `${AJS_VERSION}-${apiCalls.name}.json`)
  fs.writeFile(filePath, JSON.stringify(apiCalls), (err) => {
    if (err) throw err
    console.log(
      `\nDigest for ${apiCalls.name}:\n`,
      apiCalls.trackingAPI.filter((request) => request.url.includes('v1/p')).length,
      'Page calls \n',
      apiCalls.trackingAPI.filter((request) => request.url.includes('v1/t')).length,
      'Track calls \n',
      apiCalls.trackingAPI.filter((request) => request.url.includes('v1/i')).length,
      'Identify calls \n',
      apiCalls.trackingAPI.filter((request) => request.url.includes('v1/a')).length,
      'Alias calls \n',
      apiCalls.trackingAPI.filter((request) => request.url.includes('v1/g')).length,
      'Group calls \n',
      apiCalls.trackingAPI.length,
      'saved into',
      filePath
    )
  })
}

async function record() {
  cases.forEach(async (c) => {
    const browser = await chromium.launch({
      headless: HEADLESS === 'true',
      // 2500 is the magic number that allows for navigation to wait for AJS
      // calls to be actually fired
      slowMo: 2500,
      // devtools: true,
    })
    const context = await browser.newContext()
    if (AJS_VERSION === 'next') {
      await loadAJSNext(context)
    }

    const apiCalls: APICalls = { name: c.name, trackingAPI: [] }

    // Open new page
    const page = await context.newPage()
    await page.setViewportSize({ width: 1200, height: 800 })

    page.on('request', (request) => {
      if (URL_KEYWORDS.some((k) => request.url().includes(k))) {
        console.log(request.url())
        apiCalls.trackingAPI.push({
          method: request.method(),
          url: request.url(),
          postData: request.postDataJSON(),
          headers: request.headers(),
        })
      }
    })

    await c.scenario(page)

    // Close page
    // ---------------------
    await page.close()

    await context.close()
    await browser.close()

    // Save requests
    writeJSONFile(apiCalls)
  })
}

record()
