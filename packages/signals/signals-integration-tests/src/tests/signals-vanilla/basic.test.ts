import { test, expect, Request } from '@playwright/test'
import * as path from 'path'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { promiseTimeout } from '@internal/test-helpers'
import type { SegmentEvent } from '@segment/analytics-next'

const filePath = path.resolve(__dirname, 'index.html')

let signalReq!: Request
let analyticsReq!: Request
test.beforeEach(async ({ context }) => {
  await context.route('https://signals.segment.io/v1/*', (route, request) => {
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
  await context.route('https://api.segment.io/v1/*', (route, request) => {
    analyticsReq = request
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
  const edgeFnDownloadURL = 'https://cdn.edgefn.segment.com/MY-WRITEKEY/foo.js'
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
            downloadURL: edgeFnDownloadURL,
            version: 1,
          },
        },
      }).build()
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

  await context.route(edgeFnDownloadURL, (route, request) => {
    if (request.method().toLowerCase() !== 'get') {
      throw new Error('expect to be a GET request')
    }

    const processSignalFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`
    return route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: processSignalFn,
    })
  })
})

test('analytics loads', async ({ page }) => {
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

test('signals can fire analytics events', async ({ page }) => {
  await page.goto(`file://${filePath}`)

  await Promise.all([
    page.waitForResponse('https://signals.segment.io/v1/*'),
    page.waitForResponse('https://cdn.edgefn.segment.com/**', {
      timeout: 10000,
    }),
    page.evaluate(() => {
      void window.analytics.track('foo')
    }),
  ])

  const signalReqJSON = signalReq.postDataJSON()

  const isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const instrumentationEvents = signalReqJSON.batch.filter(
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

  await Promise.all([
    page.waitForResponse('https://api.segment.io/v1/*', { timeout: 10000 }),
    page.click('button'),
  ])

  const analyticsReqJSON = analyticsReq.postDataJSON()

  expect(analyticsReqJSON).toMatchObject({
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

test('navigation signals get sent', async ({ page }) => {
  const pageURL = `file://${filePath}`
  await page.goto(pageURL)

  const signalsResponse = page.waitForResponse(
    'https://signals.segment.io/v1/*'
  )

  // test URL change detection
  {
    await page.evaluate(() => {
      window.location.hash = '#foo'
    })
    await signalsResponse
    const signalReqJSON = signalReq.postDataJSON()

    const navigationEvents = signalReqJSON.batch.filter(
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
