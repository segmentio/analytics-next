import { test, expect } from '@playwright/test'
import { promiseTimeout } from '@internal/test-helpers'
import type { SegmentEvent } from '@segment/analytics-next'
import { IndexPage } from './page-object'

const indexPage = new IndexPage()

test.beforeEach(async ({ page }) => {
  await indexPage.load(page)
})

test('analytics loads', async ({ page }) => {
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
  await Promise.all([
    page.waitForResponse('https://signals.segment.io/v1/*'),
    page.waitForResponse('https://cdn.edgefn.segment.com/**', {
      timeout: 10000,
    }),
    page.evaluate(() => {
      void window.analytics.track('foo')
    }),
  ])

  const signalReqJSON = indexPage.signalReq.postDataJSON()

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

  const analyticsReqJSON = indexPage.analyticsReq.postDataJSON()

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
  {
    // on page load, a navigation signal should be sent
    await page.waitForResponse('https://signals.segment.io/v1/*')
    const signalReqJSON = indexPage.signalReq.postDataJSON()
    const navigationEvents = signalReqJSON.batch.filter(
      (el: SegmentEvent) => el.properties!.type === 'navigation'
    )
    expect(navigationEvents).toHaveLength(1)
    const ev = navigationEvents[0]
    expect(ev.properties).toMatchObject({
      index: 1,
      type: 'navigation',
      data: {
        action: 'pageLoad',
        url: indexPage.url,
        path: expect.any(String),
        hash: '',
        search: '',
        title: '',
      },
    })
  }

  // navigate to a new hash
  {
    await page.evaluate(() => {
      window.location.hash = '#foo'
    })
    await page.waitForResponse('https://signals.segment.io/v1/*')
    const signalReqJSON = indexPage.signalReq.postDataJSON()

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
        url: indexPage.url + '#foo',
        prevUrl: indexPage.url,
        path: expect.any(String),
        hash: '#foo',
        search: '',
        title: '',
      },
    })
  }
})
