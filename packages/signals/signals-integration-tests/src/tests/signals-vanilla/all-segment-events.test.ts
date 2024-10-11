import { test, expect } from '@playwright/test'
import { IndexPage } from './index-page'
import fs from 'fs'
import path from 'path'
import { SegmentEvent } from '@segment/analytics-next'
/**
 * This test ensures that
 */
const indexPage = new IndexPage()

const normalizeSnapshotEvent = (el: SegmentEvent) => {
  return {
    type: el.type,
    event: el.event,
    userId: el.userId,
    groupId: el.groupId,
    anonymousId: expect.any(String),
    integrations: el.integrations,
    properties: el.properties,
    context: {
      page: el.context?.page,
    },
  }
}

const snapshot = (
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'snapshots/all-segment-events-snapshot.json'),
      {
        encoding: 'utf-8',
      }
    )
  ) as SegmentEvent[]
).map(normalizeSnapshotEvent)

test('Segment events', async ({ page }) => {
  const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction' && signal.data.eventType === 'click') {
        analytics.identify('john', { found: true })
        analytics.group('foo', { hello: 'world' })
        analytics.alias('john', 'johnsmith')
        analytics.track('a track call',  {foo: 'bar'})
        analytics.page('Retail Page', 'Home', { url: 'http://my-home.com', title: 'Some Title' });
    }
  }`

  await indexPage.load(page, basicEdgeFn)
  const flush = Promise.all([
    indexPage.waitForSignalsApiFlush(),
    indexPage.waitForTrackingApiFlush(),
  ])
  await indexPage.clickButton()
  await flush

  const trackingApiReqs = indexPage.trackingAPI
    .getEvents()
    .map(normalizeSnapshotEvent)
  expect(trackingApiReqs).toEqual(snapshot)
})

test('Should dispatch events from signals that occurred before analytics was instantiated', async ({
  page,
}) => {
  const edgeFn = `
    const processSignal = (signal) => {
       if (signal.type === 'navigation' && signal.data.action === 'pageLoad') {
          analytics.page('dispatched from signals - navigation')
      }
      if (signal.type === 'userDefined') {
        analytics.track('dispatched from signals - userDefined')
      }
  }`

  await indexPage.load(page, edgeFn)
  const flush = Promise.all([
    indexPage.waitForSignalsApiFlush(),
    indexPage.waitForTrackingApiFlush(),
  ])

  // add a user defined signal before analytics is instantiated
  void indexPage.addUserDefinedSignal()
  await flush

  const trackingApiReqs = indexPage.trackingAPI.getEvents()
  expect(trackingApiReqs).toHaveLength(2)

  const pageEvents = trackingApiReqs.find((el) => el.type === 'page')!
  expect(pageEvents).toBeTruthy()
  expect(pageEvents.name).toEqual('dispatched from signals - navigation')

  const userDefinedEvents = trackingApiReqs.find((el) => el.type === 'track')!
  expect(userDefinedEvents).toBeTruthy()
  expect(userDefinedEvents.event).toEqual(
    'dispatched from signals - userDefined'
  )
})
