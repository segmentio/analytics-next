import { segmentio, SegmentioSettings } from '..'
import { Analytics } from '../../../analytics'
// @ts-ignore isOffline mocked dependency is accused as unused
import { isOffline } from '../../../core/connection'
import { Plugin } from '../../../core/plugin'
import { pageEnrichment } from '../../page-enrichment'
import { scheduleFlush } from '../schedule-flush'

jest.mock('../schedule-flush')

describe('Segment.io retries', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  let segment: Plugin

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.restoreAllMocks()

    // @ts-expect-error reassign import
    isOffline = jest.fn().mockImplementation(() => true)

    options = { apiKey: 'foo' }
    analytics = new Analytics(
      { writeKey: options.apiKey },
      { retryQueue: true }
    )
    segment = segmentio(analytics, options, {})

    await analytics.register(segment, pageEnrichment)
  })

  test('buffers offline events', async () => {
    await analytics.track('event')
    expect(scheduleFlush).toHaveBeenCalled()
  })
})
