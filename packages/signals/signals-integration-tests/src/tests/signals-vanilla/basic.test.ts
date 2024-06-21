import { test, expect, Request } from '@playwright/test'
import * as path from 'path'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { promiseTimeout } from '@internal/test-helpers'
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
    console.log(JSON.stringify(request.postDataJSON(), null, 2))
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
  const signalsResponse = page.waitForResponse(
    'https://signals.segment.io/v1/*'
  )

  await page.evaluate(() => {
    void window.analytics.track('foo')
  })

  // get signals response
  await signalsResponse
  let req = signalReq.postDataJSON()

  let isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  expect(req.writeKey).toBe('<SOME_WRITE_KEY>')
  const instrumentationEvents = req.batch.filter(
    (el: SegmentEvent) => el.properties!.type === 'instrumentation'
  )
  expect(instrumentationEvents).toHaveLength(1)
  const ev = instrumentationEvents[0]
  expect(ev.event).toBe('Segment Signal Generated')
  expect(ev.type).toBe('track')
  expect(typeof ev.properties.index).toBe('number')
  expect(ev.properties.type).toBe('instrumentation')
  const rawEvent = ev.properties.data.rawEvent
  console.log(JSON.stringify(rawEvent, null, 2))
  expect(rawEvent.type).toBe('track')
  expect(rawEvent.event).toBe('foo')
  expect(rawEvent.anonymousId).toEqual(expect.any(String))
  expect(rawEvent.timestamp).toEqual(expect.stringMatching(isoDateRegEx))

  // get analytics (tracking API response)
  let analyticsRequest!: Request
  await page.route('https://api.segment.io/v1/*', (route, request) => {
    analyticsRequest = request
    console.log(JSON.stringify(request.postDataJSON(), null, 2))
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
  await page.click('button')
  await page.waitForResponse('https://api.segment.io/v1/*', { timeout: 10000 })
  req = analyticsRequest.postDataJSON()

  isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  expect(req.writeKey).toBe('<SOME_WRITE_KEY>')
  expect(req.event).toBe('click [interaction]')
  expect(req.properties.eventType).toBe('click')
  expect(req.context.__eventOrigin).toEqual({ type: 'Signal' })

  expect(req.properties.target).toMatchObject({
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
  })
})
