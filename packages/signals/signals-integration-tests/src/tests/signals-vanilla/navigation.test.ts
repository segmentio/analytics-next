import { test, expect, Request } from '@playwright/test'
import * as path from 'path'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import type { SegmentEvent } from '@segment/analytics-next'

const filePath = path.resolve(__dirname, 'index.html')

test.beforeEach(async ({ context }) => {
  await context.route(
    'https://cdn.segment.com/v1/projects/*/settings',
    (route, request) => {
      if (request.method().toLowerCase() !== 'get') {
        return route.continue()
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          new CDNSettingsBuilder({ writeKey: '<SOME_WRITE_KEY>' }).build()
        ),
      })
    }
  )
})

test('navigation signals get sent', async ({ page }) => {
  const pageURL = `file://${filePath}`
  await page.goto(pageURL)
  const signalsResponse = page.waitForResponse(
    'https://signals.segment.io/v1/*'
  )
  let signalReq!: Request
  await page.route('https://signals.segment.io/v1/*', (route, request) => {
    signalReq = request
    if (request.method().toLowerCase() !== 'post') {
      throw new Error(`Unexpected method: ${request.method()}`)
    }
    return route.fulfill({
      contentType: 'application/json',
      status: 201,
      body: JSON.stringify({
        success: true,
      }),
    })
  })
  // test URL change detection
  {
    await page.evaluate(() => {
      window.location.hash = '#foo'
    })
    await signalsResponse
    const req = signalReq.postDataJSON()

    const navigationEvents = req.batch.filter(
      (el: SegmentEvent) => el.properties!.type === 'navigation'
    )
    expect(navigationEvents).toHaveLength(1)
    const ev = navigationEvents[0]
    expect(ev.properties).toMatchObject({
      index: expect.any(Number),
      type: 'navigation',
      data: {
        action: 'urlChange',
        url: pageURL + '#foo',
        path: expect.any(String),
        hash: '#foo',
        search: '',
        title: '',
      },
    })
  }
})
