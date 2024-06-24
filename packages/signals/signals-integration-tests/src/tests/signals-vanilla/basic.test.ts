import { test, expect, Request } from '@playwright/test'
import * as path from 'path'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { promiseTimeout } from '@internal/test-helpers'
import type { SegmentEvent } from '@segment/analytics-next'
import { edgeFn } from '../../fixtures/signals-edge-fn-response'

const filePath = path.resolve(__dirname, 'index.html')

test.beforeEach(async ({ context }) => {
  await context.route(
    'https://cdn.segment.com/v1/projects/*/settings',
    (route, request) => {
      if (request.method().toLowerCase() !== 'get') {
        throw new Error('expect to be a GET request')
      }

      const cdnSettings = new CDNSettingsBuilder({
        writeKey: '<SOME_WRITE_KEY>',
        baseCDNSettings: {
          edgeFunction: {
            downloadUrl:
              'https://cdn.edgefn.segment.com/MY-WRITEKEY/125eb487-795a-467a-968e-2bf7385fce20.js',
            version: 1,
          },
        },
      }).build()
      console.log(cdnSettings)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cdnSettings),
      })
    }
  )

  await context.route('https://cdn.edgefn.segment.com/**', (route, request) => {
    if (request.method().toLowerCase() !== 'get') {
      throw new Error('expect to be a GET request')
    }
    return route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: edgeFn,
    })
  })
})

test('analytics loads correctly', async ({ page }) => {
  await page.goto(`file://${filePath}`)

  // Perform actions and assertions
  const analytics = await page.evaluate(() => {
    return window.analytics
  })

  const p = (await page.evaluate(() => {
    void window.analytics.page()
    return new Promise((resolve) => window.analytics.on('page', resolve))
  })) as Promise<any>

  expect(analytics).toBeDefined()

  await promiseTimeout(p, 2000, 'analytics.on("page") did not resolve')
})

test('signals can trigger events', async ({ page }) => {
  await page.goto(`file://${filePath}`)
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
  await Promise.all([
    page.waitForResponse('https://signals.segment.io/v1/*'),
    page.evaluate(() => {
      void window.analytics.track('foo')
    }),
  ])

  let req = signalReq.postDataJSON()

  const isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  expect(req.writeKey).toBe('<SOME_WRITE_KEY>')
  const instrumentationEvents = req.batch.filter(
    (el: SegmentEvent) => el.properties!.type === 'instrumentation'
  )
  expect(instrumentationEvents).toHaveLength(1)
  const ev = instrumentationEvents[0]
  expect(ev.event).toBe('Segment Signal Generated')
  expect(ev.type).toBe('track')
  const rawEvent = ev.properties.data.rawEvent
  expect(rawEvent).toMatchObject({
    type: 'track',
    event: 'foo',
    anonymousId: expect.any(String),
    timestamp: expect.stringMatching(isoDateRegEx),
  })

  // get analytics (tracking API response)
  let analyticsRequest!: Request
  await page.route('https://api.segment.io/v1/*', (route, request) => {
    analyticsRequest = request
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

  await Promise.all([
    page.waitForResponse('https://api.segment.io/v1/*', { timeout: 10000 }),
    page.click('button'),
  ])

  req = analyticsRequest.postDataJSON()

  expect(req).toMatchObject({
    writeKey: '<SOME_WRITE_KEY>',
    event: 'click [interaction]',
    properties: {
      eventType: 'click',
      target: {
        attributes: [
          {
            name: 'id',
            value: 'some-button',
          },
        ],
        classList: [],
        id: 'some-button',
        labels: [],
        name: '',
        nodeName: 'BUTTON',
        nodeType: 1,
        nodeValue: null,
        tagName: 'BUTTON',
        title: '',
        type: 'submit',
        value: '',
      },
    },
    context: {
      __eventOrigin: {
        type: 'Signal',
      },
    },
  })
})
