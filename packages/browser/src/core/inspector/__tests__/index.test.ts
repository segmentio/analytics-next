import { Analytics } from '../../analytics'

let analytics: Analytics

describe('Inspector interface', () => {
  beforeEach(() => {
    Object.assign((window.__SEGMENT_INSPECTOR__ ??= {}), {
      triggered: jest.fn(),
      enriched: jest.fn(),
      delivered: jest.fn(),
    })

    analytics = new Analytics({
      writeKey: 'abc',
    })
  })

  it('notifies the connected inspector client about each event API call and delivery', async () => {
    const deliveryPromise = analytics.track('Test event').catch(() => {})

    expect(window.__SEGMENT_INSPECTOR__?.triggered).toHaveBeenCalledTimes(1)
    expect(window.__SEGMENT_INSPECTOR__?.enriched).toHaveBeenCalledTimes(1)

    expect(window.__SEGMENT_INSPECTOR__?.triggered).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        event: expect.objectContaining({
          event: 'Test event',
          type: 'track',
        }),
      })
    )

    await deliveryPromise

    expect(window.__SEGMENT_INSPECTOR__?.delivered).toHaveBeenCalledTimes(1)
  })
})
