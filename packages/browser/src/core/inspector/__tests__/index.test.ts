import { Analytics } from '../../analytics'

let analytics: Analytics

describe('Inspector interface', () => {
  beforeEach(() => {
    window.__SEGMENT_INSPECTOR__ = {
      start: jest.fn(),
      trace: jest.fn(),
    }

    analytics = new Analytics({
      writeKey: 'abc',
    })
  })

  it('accepts and starts up an inspector client trying to connect', () => {
    expect(window.__SEGMENT_INSPECTOR__?.start).toHaveBeenCalledTimes(1)
  })

  it('notifies the connected inspector client about each event API call and delivery', async () => {
    expect(window.__SEGMENT_INSPECTOR__?.trace).not.toHaveBeenCalled()

    const timestampMatcher = expect.stringMatching(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    )
    const deliveryPromise = analytics.track('Test event').catch(() => {})

    // expect 2 calls, triggered report, followed enriched report
    expect(window.__SEGMENT_INSPECTOR__?.trace).toHaveBeenCalledTimes(2)

    expect(window.__SEGMENT_INSPECTOR__?.trace).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'triggered',
        timestamp: timestampMatcher,
        event: expect.objectContaining({
          event: 'Test event',
          type: 'track',
        }),
      })
    )

    await deliveryPromise

    // triggered -> enriched -> delivered
    expect(window.__SEGMENT_INSPECTOR__?.trace).toHaveBeenCalledTimes(3)

    expect(window.__SEGMENT_INSPECTOR__?.trace).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'delivered',
        timestamp: timestampMatcher,
        event: expect.objectContaining({
          event: 'Test event',
          type: 'track',
        }),
      })
    )
  })
})
