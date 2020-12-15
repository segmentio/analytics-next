import { chromium, ChromiumBrowserContext } from 'playwright'
import fs from 'fs-extra'
import path from 'path'
import segment from './cases/segment'
import milanuncios from './cases/milanuncios'
import staples from './cases/staples'
import local from './cases/local'
import fetch from 'node-fetch'

import http from 'http'
import handler from 'serve-handler'

const cases = [segment, milanuncios, staples, local]

const CASES = process.env.CASES
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

export async function startLocalServer(): Promise<string> {
  const srv = http.createServer((request, response) => {
    return handler(request, response)
  })

  return new Promise(async (resolve, reject) => {
    const desiredPort = process.env.PORT ?? 5000
    const desiredPath = `http://localhost:${desiredPort}`

    try {
      const ping = await fetch(desiredPath)
      if (ping.ok) {
        return resolve(desiredPath)
      }
    } catch (err) {
      srv.on('error', reject)
      srv.listen(desiredPort, () => {
        // @ts-expect-error
        const { port } = srv.address()
        resolve(`http://localhost:${port ?? desiredPort}`)
      })
    }
  })
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
  const filePath = path.join(__dirname, 'data/requests/', `${AJS_VERSION}-${apiCalls.name}.json`)
  await fs.writeFile(filePath, JSON.stringify(apiCalls))

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
}

async function record() {
  const runFor = cases.filter((scenario) => CASES?.split(',').includes(scenario.name) ?? true)

  const promises = runFor.map(async (c) => {
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
    await writeJSONFile(apiCalls)
  })

  await Promise.all(promises)
}

record().catch((err) => {
  console.error(err)
  process.exit(1)
})
