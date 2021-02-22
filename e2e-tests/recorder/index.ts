import { chromium, ChromiumBrowserContext, Page } from 'playwright'
import fs from 'fs-extra'
import path from 'path'
import { HEADLESS, DEVTOOLS } from './config'
import { startLocalServer } from './localServer'
import { Cookie } from '../request-comparison/types'
import fetch from 'node-fetch'

export async function loadAJSNext(
  context: ChromiumBrowserContext
): Promise<void> {
  const url = await startLocalServer()

  const res = await fetch(`${url}/dist/umd/standalone.js`)
  const body = await res.text()

  await context.route(`**/analytics.min.js`, (route) => {
    route.fulfill({
      status: 200,
      body,
    })
  })
}

export async function writeJSONFile(apiCalls: any, name: string) {
  const filePath = path.join(__dirname, '../data/requests/', `${name}.json`)

  await fs.writeFile(filePath, JSON.stringify(apiCalls))
}

export async function navigate(params: {
  c: {
    name: string
    scenario: (
      page: Page,
      writeKey?: string,
      ajsVersion?: string
    ) => Promise<void>
    getIntegrations?: any
  }
  recordCallsFunc: (page: Page, networkRequests: any[]) => void
  version: string
  writeKey?: string
}): Promise<{
  networkRequests: any[]
  cookies: Cookie[]
  integrations: string[]
}> {
  const browser = await chromium.launch({
    headless: HEADLESS === 'true',
    slowMo: 2500,
    devtools: DEVTOOLS,
  })

  const context = await browser.newContext({ bypassCSP: true })

  if (params.version === 'next' && !params.writeKey) {
    await loadAJSNext(context)
  }

  // Open new page
  const page = await context.newPage()

  await page.setViewportSize({ width: 1200, height: 800 })

  const networkRequests: any[] = []
  params.recordCallsFunc(page, networkRequests)

  await params.c.scenario(page, params.writeKey, params.version)

  const cookies = await context.cookies()
  const integrations = params.c.getIntegrations
    ? await params.c.getIntegrations(page, params.version)
    : []

  // Close page
  // ---------------------
  await page.close()

  await context.close()
  await browser.close()

  return { networkRequests, cookies, integrations }
}
