import { test, expect } from '@playwright/test'
import { commonSignalData } from '../../helpers/fixtures'
import { IndexPage } from './index-page'

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

let indexPage: IndexPage

test.beforeEach(async ({ page }) => {
  indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
})

test('network signals fetch', async () => {
  /**
   * Make a fetch call, see if it gets sent to the signals endpoint
   */
  await indexPage.network.mockTestRoute()
  await indexPage.network.makeFetchCall()
  await indexPage.waitForSignalsApiFlush()
  const networkEvents = indexPage.signalsAPI.getEvents('network')
  const requests = networkEvents.filter(
    (el) => el.properties!.data.action === 'request'
  )
  expect(requests).toHaveLength(1)
  expect(requests[0].properties!.data.data).toEqual({ foo: 'bar' })

  const responses = networkEvents.filter(
    (el) => el.properties!.data.action === 'response'
  )
  expect(responses).toHaveLength(1)
  expect(responses[0].properties!.data.data).toEqual({ someResponse: 'yep' })
})

test('network signals xhr', async () => {
  /**
   * Make a xhr call, see if it gets sent to the signals endpoint
   */
  await indexPage.network.mockTestRoute()
  await indexPage.network.makeXHRCall()
  await indexPage.waitForSignalsApiFlush()
  const networkEvents = indexPage.signalsAPI.getEvents('network')
  expect(networkEvents).toHaveLength(2)
  const requests = networkEvents.filter(
    (el) => el.properties!.data.action === 'request'
  )
  expect(requests).toHaveLength(1)
  expect(requests[0].properties!.data.data).toEqual({ foo: 'bar' })

  const responses = networkEvents.filter(
    (el) => el.properties!.data.action === 'response'
  )
  expect(responses).toHaveLength(1)
  expect(responses[0].properties!.data.data).toEqual({ someResponse: 'yep' })
  expect(responses[0].properties!.data.page).toEqual(commonSignalData.page)
})

test('instrumentation signals', async () => {
  /**
   * Make an analytics.page() call, see if it gets sent to the signals endpoint
   */
  await Promise.all([
    indexPage.makeAnalyticsPageCall(),
    indexPage.waitForSignalsApiFlush(),
  ])

  const isoDateRegEx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const instrumentationEvents =
    indexPage.signalsAPI.getEvents('instrumentation')
  expect(instrumentationEvents).toHaveLength(1)
  const ev = instrumentationEvents[0]
  expect(ev.event).toBe('Segment Signal Generated')
  expect(ev.type).toBe('track')
  const rawEvent = ev.properties!.data.rawEvent
  expect(rawEvent).toMatchObject({
    type: 'page',
    anonymousId: expect.any(String),
    timestamp: expect.stringMatching(isoDateRegEx),
  })
})

test('interaction signals', async () => {
  /**
   * Make a button click, see if it:
   * - creates an interaction signal that sends to the signals endpoint
   * - creates an analytics event that sends to the tracking endpoint
   */
  await Promise.all([
    indexPage.clickButton(),
    indexPage.waitForSignalsApiFlush(),
    indexPage.waitForTrackingApiFlush(),
  ])

  const interactionSignals = indexPage.signalsAPI.getEvents('interaction')
  expect(interactionSignals).toHaveLength(1)
  const data = {
    eventType: 'click',
    target: {
      attributes: {
        id: 'some-button',
      },
      classList: [],
      id: 'some-button',
      labels: [],
      name: '',
      nodeName: 'BUTTON',
      tagName: 'BUTTON',
      title: '',
      type: 'submit',
      value: '',
    },
    page: commonSignalData.page,
  }

  expect(interactionSignals[0]).toMatchObject({
    event: 'Segment Signal Generated',
    type: 'track',
    properties: {
      type: 'interaction',
      data,
    },
  })

  const analyticsReqJSON = indexPage.trackingAPI.lastEvent()
  expect(analyticsReqJSON).toMatchObject({
    writeKey: '<SOME_WRITE_KEY>',
    event: 'click [interaction]',
    properties: data,
    context: {
      __eventOrigin: {
        type: 'Signal',
      },
    },
  })
})

test('navigation signals', async ({ page }) => {
  /**
   * Load a page and then click, see if it:
   * - creates a navigation signal that sends to the signals endpoint
   * Click a link, see if it
   * - creates a navigation signal that sends to the signals endpoint
   */
  {
    // on page load, a navigation signal should be sent
    await indexPage.waitForSignalsApiFlush()
    expect(indexPage.signalsAPI.getEvents()).toHaveLength(1)
    const ev = indexPage.signalsAPI.lastEvent('navigation')
    expect(ev.properties).toMatchObject({
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
    const flush = indexPage.waitForSignalsApiFlush()
    await page.evaluate(() => {
      window.location.hash = '#foo'
    })
    await flush
    expect(indexPage.signalsAPI.getEvents()).toHaveLength(2)
    const ev = indexPage.signalsAPI.lastEvent('navigation')
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
        page: expect.any(Object),
      },
    })
  }
})
