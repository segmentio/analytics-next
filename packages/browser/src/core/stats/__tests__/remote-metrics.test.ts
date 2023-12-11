import unfetch from 'unfetch'
import { RemoteMetrics } from '../remote-metrics'
import { version } from '../../../generated/version'

jest.mock('unfetch', () => {
  return jest.fn()
})

describe('remote metrics', () => {
  test('stores metrics in a queue when sampling', () => {
    const remote = new RemoteMetrics({
      sampleRate: 100,
    })
    remote.increment('analytics_js.banana', ['phone:1'])

    expect(remote.queue.length).toBe(1)
    const metric = remote.queue[0]
    expect(metric.tags).toEqual({
      library: 'analytics.js',
      library_version: `npm:next-${version}`,
      phone: '1',
    })

    expect(metric.metric).toBe('analytics_js.banana')
    expect(metric.type).toBe('Counter')
    expect(metric.value).toBe(1)
  })

  test('does not store when not sampling', () => {
    const remote = new RemoteMetrics({
      sampleRate: 0,
    })
    remote.increment('analytics_js.banana', ['phone:1'])

    expect(remote.queue).toMatchInlineSnapshot(`[]`)
  })

  test('ignores messages after reaching threshold', () => {
    const remote = new RemoteMetrics({
      sampleRate: 100,
      maxQueueSize: 3,
    })

    remote.increment('analytics_js.banana', ['phone:1'])
    remote.increment('analytics_js.banana', ['phone:1'])
    remote.increment('analytics_js.banana', ['phone:1'])
    remote.increment('analytics_js.banana', ['phone:1'])

    expect(remote.queue.length).toBe(3)
  })

  test('force flushes errors', () => {
    const remote = new RemoteMetrics({
      sampleRate: 100,
    })

    const spy = jest.spyOn(remote, 'flush')

    remote.increment('analytics_js.banana', ['phone:1'])
    expect(spy).not.toHaveBeenCalled()

    remote.increment('analytics_js.banana.error', ['phone:1'])
    expect(spy).toHaveBeenCalled()
  })

  test('sends requests on flush', async () => {
    const spy = jest.mocked(unfetch).mockImplementation()

    const remote = new RemoteMetrics({
      sampleRate: 100,
    })

    remote.increment('analytics_js.banana', ['phone:1'])
    await remote.flush()

    expect(spy).toHaveBeenCalled()
    const [url, request] = spy.mock.calls[0]

    expect(url).toBe('https://api.segment.io/v1/m')
    expect(request).toMatchInlineSnapshot(
      { body: expect.anything() },
      `
      {
        "body": Anything,
        "headers": {
          "Content-Type": "text/plain",
        },
        "method": "POST",
      }
    `
    )
    const body = JSON.parse(request?.body as any)
    expect(body).toMatchInlineSnapshot(
      {
        series: [
          {
            tags: {
              library_version: expect.any(String),
            },
          },
        ],
      },
      `
      {
        "series": [
          {
            "metric": "analytics_js.banana",
            "tags": {
              "library": "analytics.js",
              "library_version": Any<String>,
              "phone": "1",
            },
            "type": "Counter",
            "value": 1,
          },
        ],
      }
    `
    )
  })

  test('clears queue after sending', async () => {
    const remote = new RemoteMetrics({
      sampleRate: 100,
    })

    remote.increment('analytics_js.banana', ['phone:1'])
    expect(remote.queue.length).toBe(1)

    await remote.flush()
    expect(remote.queue.length).toBe(0)
  })

  test('does not crash on errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation()

    const error = new Error('aaay')
    jest.mocked(unfetch).mockImplementation(() => {
      throw error
    })

    const remote = new RemoteMetrics({
      sampleRate: 100,
    })

    remote.increment('analytics_js.banana', ['phone:1'])
    await remote.flush()

    expect(errorSpy).toHaveBeenCalledWith(
      'Error sending segment performance metrics',
      error
    )
  })

  test('disables metrics reporting in case of errors', async () => {
    jest.spyOn(console, 'error').mockImplementation()

    const error = new Error('aaay')
    jest.mocked(unfetch).mockImplementation(() => {
      throw error
    })

    const remote = new RemoteMetrics({
      sampleRate: 100,
    })

    remote.increment('analytics_js.banana', ['phone:1'])
    await remote.flush()

    expect(remote.sampleRate).toBe(0)
  })

  test('flushs on a schedule', () => {
    jest.useFakeTimers()

    const remote = new RemoteMetrics({
      sampleRate: 100,
      flushTimer: 100,
    })

    const flushSpy = jest.spyOn(remote, 'flush')

    remote.increment('analytics_js.banana', ['phone:1'])
    jest.advanceTimersByTime(500)

    expect(flushSpy).toHaveBeenCalledTimes(5)
  })
})
