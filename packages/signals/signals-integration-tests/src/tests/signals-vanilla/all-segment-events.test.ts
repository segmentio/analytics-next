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
    type: el.properties?.type,
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
      analytics.identify('john', { found: true })
      analytics.group('foo', { hello: 'world' })
      analytics.alias('john', 'johnsmith')
      analytics.track('a track call',  {foo: 'bar'})
      analytics.page('Retail Page', 'Home', { url: 'http://my-home.com', title: 'Some Title' });
  }`

  await indexPage.load(page, basicEdgeFn)
  await Promise.all([
    indexPage.clickButton(),
    indexPage.waitForSignalsApiFlush(),
    indexPage.waitForTrackingApiFlush(),
  ])

  const trackingApiReqs = indexPage.trackingApiReqs.map(normalizeSnapshotEvent)

  expect(trackingApiReqs).toEqual(snapshot)
})
