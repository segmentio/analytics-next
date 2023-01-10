import { createSuccess } from '../../test-helpers/factories'
import { AnalyticsBrowser } from '../..'

import unfetch from 'unfetch'
jest.mock('unfetch')
jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

const writeKey = 'foo'

describe('Inspector', () => {
  beforeEach(() => {
    Object.assign(((window as any)['__SEGMENT_INSPECTOR__'] ??= {}), {
      attach: jest.fn(),
    })
  })

  it('attaches to inspector', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    expect(
      ((window as any)['__SEGMENT_INSPECTOR__'] as any).attach
    ).toHaveBeenCalledWith(analytics)
  })

  it('emits essential message lifecycle events', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const triggeredFn = jest.fn()
    const enrichedFn = jest.fn()
    const deliveredFn = jest.fn()

    analytics.on('dispatch_start', triggeredFn)
    analytics.queue.on('message_enriched', enrichedFn)
    analytics.queue.on('message_delivered', deliveredFn)

    const deliveryPromise = analytics.track('Test event').catch(() => {})

    expect(triggeredFn).toHaveBeenCalledTimes(1)

    expect(triggeredFn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        event: expect.objectContaining({
          event: 'Test event',
          type: 'track',
        }),
      })
    )

    await deliveryPromise

    expect(enrichedFn).toHaveBeenCalledTimes(1)
    expect(deliveredFn).toHaveBeenCalledTimes(1)
  })
})
