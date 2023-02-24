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

    expect(enrichedFn).toHaveBeenCalledTimes(2)
    expect(deliveredFn).toHaveBeenCalledTimes(1)
  })

  it('emits message enrichment events with enricher information', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })

    const enrichedFn = jest.fn()

    analytics.queue.on('message_enriched', enrichedFn)

    await analytics.register({
      name: 'Test plugin',
      version: '1.0.0',
      type: 'before',
      isLoaded: () => true,
      load: () => Promise.resolve(),
      track: (ctx) => ctx,
    })

    const ctx = await analytics.track('Test event').catch(() => {})

    expect(enrichedFn).toHaveBeenLastCalledWith(
      ctx,
      expect.objectContaining({
        name: 'Test plugin',
        type: 'before',
      })
    )
  })

  it('emits expected events if before plugin throws error ', async () => {
    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey,
      },
      { retryQueue: false }
    )

    const failedFn = jest.fn()
    const deliveredFn = jest.fn()

    analytics.queue.on('delivery_failure', failedFn)
    analytics.queue.on('message_delivered', deliveredFn)

    await analytics.register({
      name: 'Faulty Plugin',
      version: '1.0.0',
      type: 'before',
      isLoaded: () => true,
      load: () => Promise.resolve(),
      track: () => {
        throw new Error()
      },
    })

    await analytics.track('Faulty event')

    expect(failedFn).toHaveBeenCalledTimes(1)
    expect(deliveredFn).not.toHaveBeenCalled()
  })
})
