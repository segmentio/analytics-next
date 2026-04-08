const fetch = jest.fn()

jest.mock('unfetch', () => {
  return fetch
})

import { createError, createSuccess } from '../../../test-helpers/factories'
import batch from '../batched-dispatcher'
import { resolveHttpConfig } from '../shared-dispatcher'

const fatEvent = {
  _id: '609c0e91fe97b680e384d6e4',
  index: 5,
  guid: 'ca7fac24-41c9-45db-bc53-59b544e43943',
  isActive: false,
  balance: '$2,603.43',
  picture: 'http://placehold.it/32x32',
  age: 36,
  eyeColor: 'blue',
  name: 'Myers Hoover',
  gender: 'male',
  company: 'SILODYNE',
  email: 'myershoover@silodyne.com',
  phone: '+1 (986) 580-3562',
  address: '240 Ryder Avenue, Belva, Nebraska, 929',
  about:
    'Non eu nulla exercitation consectetur reprehenderit culpa mollit non consectetur magna tempor. Do et duis occaecat eu culpa dolor elit et est pariatur qui. Veniam dolore amet minim veniam quis esse. Aute commodo sint officia velit dolor. Sit enim nisi eu exercitation dolore nulla dolor occaecat. Sunt eu pariatur reprehenderit ipsum et nulla cillum culpa ea.\r\n',
  registered: '2019-04-13T09:29:21 +05:00',
  latitude: 68.879515,
  longitude: -46.670697,
  tags: ['magna', 'ex', 'nostrud', 'mollit', 'laborum', 'exercitation', 'sit'],
  friends: [
    {
      id: 0,
      name: 'Lynn Brock',
    },
    {
      id: 1,
      name: 'May Hull',
    },
    {
      id: 2,
      name: 'Elena Henderson',
    },
  ],
  greeting: 'Hello, Myers Hoover! You have 5 unread messages.',
  favoriteFruit: 'strawberry',
}

describe('Batching', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    jest.useFakeTimers({
      now: new Date('9 Jun 1993 00:00:00Z').getTime(),
    })
    fetch.mockReturnValue(createSuccess({}))
  })

  afterEach(() => {
    // clear any pending sendBatch calls
    jest.runAllTimers()
    jest.useRealTimers()
  })

  it('does not send requests right away', async () => {
    const { dispatch } = batch(`https://api.segment.io`)

    await dispatch(`https://api.segment.io/v1/t`, {
      hello: 'world',
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends requests after a batch limit is hit', async () => {
    const { dispatch } = batch(`https://api.segment.io`, {
      size: 3,
    })

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'first',
    })
    expect(fetch).not.toHaveBeenCalled()

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'second',
    })
    expect(fetch).not.toHaveBeenCalled()

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'third',
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"},{"event":"third"}],"sentAt":"1993-06-09T00:00:00.000Z"}",
          "credentials": undefined,
          "headers": {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)
  })

  it('uses configured protocol when apiHost has no scheme', async () => {
    const { dispatch } = batch(`api.segment.io`, { size: 1 }, undefined, 'http')

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'first',
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url] = fetch.mock.calls[0]
    expect(url).toBe('http://api.segment.io/b')
  })

  it('sends requests if the size of events exceeds tracking API limits', async () => {
    const { dispatch } = batch(`https://api.segment.io`, {
      size: 600,
    })

    // fatEvent is about ~1kb in size
    for (let i = 0; i < 250; i++) {
      await dispatch(`https://api.segment.io/v1/t`, {
        event: 'fat event',
        properties: fatEvent,
      })
    }
    expect(fetch).not.toHaveBeenCalled()

    for (let i = 0; i < 250; i++) {
      await dispatch(`https://api.segment.io/v1/t`, {
        event: 'fat event',
        properties: fatEvent,
      })
    }

    // still called, even though our batch limit is 600 events
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends requests if the size of events exceeds keepalive limits', async () => {
    const { dispatch } = batch(`https://api.segment.io`, {
      size: 600,
      keepalive: true,
    })

    // fatEvent is about ~1kb in size
    for (let i = 0; i < 250; i++) {
      await dispatch(`https://api.segment.io/v1/t`, {
        event: 'small event',
      })
    }
    expect(fetch).not.toHaveBeenCalled()

    for (let i = 0; i < 65; i++) {
      await dispatch(`https://api.segment.io/v1/t`, {
        event: 'fat event',
        properties: fatEvent,
      })
    }

    // still called, even though our batch limit is 600 events
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends requests when the timeout expires', async () => {
    const { dispatch } = batch(`https://api.segment.io`, {
      size: 100,
      timeout: 10000, // 10 seconds
    })

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'first',
    })
    expect(fetch).not.toHaveBeenCalled()

    await dispatch(`https://api.segment.io/v1/i`, {
      event: 'second',
    })

    jest.advanceTimersByTime(11000) // 11 seconds

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"}],"sentAt":"1993-06-09T00:00:10.000Z"}",
          "credentials": undefined,
          "headers": {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)
  })

  it('clears the buffer between flushes', async () => {
    const { dispatch } = batch(`https://api.segment.io`, {
      size: 100,
      timeout: 10000, // 10 seconds
    })

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'first',
    })

    jest.advanceTimersByTime(11000) // 11 seconds

    await dispatch(`https://api.segment.io/v1/i`, {
      event: 'second',
    })

    jest.advanceTimersByTime(11000) // 11 seconds

    expect(fetch).toHaveBeenCalledTimes(2)

    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"}],"sentAt":"1993-06-09T00:00:10.000Z"}",
          "credentials": undefined,
          "headers": {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)

    expect(fetch.mock.calls[1]).toMatchInlineSnapshot(`
      [
        "https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"second"}],"sentAt":"1993-06-09T00:00:21.000Z"}",
          "credentials": undefined,
          "headers": {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)
  })

  it('removes sentAt from individual events', async () => {
    const { dispatch } = batch(`https://api.segment.io`, {
      size: 2,
    })

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'first',
      sentAt: new Date('11 Jun 1993 00:01:00Z'),
    })

    await dispatch(`https://api.segment.io/v1/t`, {
      event: 'second',
      sentAt: new Date('11 Jun 1993 00:02:00Z'),
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"}],"sentAt":"1993-06-09T00:00:00.000Z"}",
          "credentials": undefined,
          "headers": {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)
  })

  describe('on unload', () => {
    it('flushes the batch', async () => {
      const { dispatch } = batch(`https://api.segment.io`)

      dispatch(`https://api.segment.io/v1/t`, {
        hello: 'world',
      }).catch(console.error)

      dispatch(`https://api.segment.io/v1/t`, {
        bye: 'world',
      }).catch(console.error)

      expect(fetch).not.toHaveBeenCalled()

      window.dispatchEvent(new Event('pagehide'))

      expect(fetch).toHaveBeenCalledTimes(1)

      // any dispatch attempts after the page has unloaded are flushed immediately
      // this can happen if analytics.track is called right before page is navigated away
      dispatch(`https://api.segment.io/v1/t`, {
        afterlife: 'world',
      }).catch(console.error)

      // no queues, no waiting, instatneous
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('flushes in batches of no more than 64kb', async () => {
      const { dispatch } = batch(`https://api.segment.io`, {
        size: 1000,
      })

      // fatEvent is about ~1kb in size
      for (let i = 0; i < 80; i++) {
        await dispatch(`https://api.segment.io/v1/t`, {
          event: 'fat event',
          properties: fatEvent,
        })
      }

      expect(fetch).not.toHaveBeenCalled()

      window.dispatchEvent(new Event('pagehide'))

      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('retry semantics and X-Retry-Count header', () => {
    function createBatch(config?: Parameters<typeof batch>[1]) {
      return batch(`https://api.segment.io`, {
        size: 1,
        timeout: 1000,
        maxRetries: 2,
        ...config,
      })
    }

    async function dispatchOne() {
      const { dispatch } = createBatch()
      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })
    }

    it('T01 Success: no retry, no X-Retry-Count header', async () => {
      fetch.mockReturnValue(createSuccess({}))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBeUndefined()
    })

    it('T02 Retryable 500: backoff used', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 500 }))
        .mockReturnValueOnce(createError({ status: 500 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch()

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // First attempt happens immediately
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()

      // First retry uses exponential backoff
      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T03 Non-retryable 5xx: 501', async () => {
      fetch.mockReturnValue(createError({ status: 501 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBeUndefined()
    })

    it('T04 Non-retryable 5xx: 505', async () => {
      fetch.mockReturnValue(createError({ status: 505 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBeUndefined()
    })

    it('T05 Non-retryable 5xx: 511 (no auth)', async () => {
      fetch.mockReturnValue(createError({ status: 511 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBeUndefined()
    })

    it('T06 Retry-After 429: delay, no backoff, no retry budget', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '2')

      fetch
        .mockReturnValueOnce(createError({ status: 429, headers }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // First attempt
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()

      // Retry should wait exactly Retry-After seconds
      jest.advanceTimersByTime(1000)
      expect(fetch).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1000)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T07 408 with Retry-After: ignores Retry-After, uses exponential backoff', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '2')

      fetch
        .mockReturnValueOnce(createError({ status: 408, headers }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()

      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T08 503 uses exponential backoff', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '2')

      fetch
        .mockReturnValueOnce(createError({ status: 503, headers }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()

      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T09 429 without Retry-After: backoff retry', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 429 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()

      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T10 Retryable 4xx: 408 without Retry-After', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 408 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T12 413: non-retryable for batched dispatcher', async () => {
      fetch.mockReturnValue(createError({ status: 413 }))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.advanceTimersByTime(1500)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()
    })

    it('T13 Retryable 4xx: 460', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 460 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T14 Non-retryable 4xx: 404', async () => {
      fetch.mockReturnValue(createError({ status: 404 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBeUndefined()
    })

    it('T15 Network error (IO): retried with backoff', async () => {
      fetch
        .mockRejectedValueOnce(new Error('network error'))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T16 Max retries exhausted (backoff)', async () => {
      const maxRetries = 1

      fetch.mockReturnValue(createError({ status: 500 }))

      const { dispatch } = createBatch({ maxRetries, timeout: 1000 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // First attempt + maxRetries additional attempts
      jest.runAllTimers()

      expect(fetch).toHaveBeenCalledTimes(maxRetries + 1)
      const retryHeaders = fetch.mock.calls
        .slice(1)
        .map((c: any) => c[1].headers['X-Retry-Count'])
      expect(retryHeaders).toEqual(['1'])
    })

    it('T17 Retry-After attempts do not consume retry budget', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '1')

      // First two responses are 429 with Retry-After, then 500s
      fetch
        .mockReturnValueOnce(createError({ status: 429, headers }))
        .mockReturnValueOnce(createError({ status: 429, headers }))
        .mockReturnValueOnce(createError({ status: 500 }))
        .mockReturnValue(createError({ status: 500 }))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1000 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // Two Retry-After driven retries
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(1000)

      expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2)
      const retryCounts = fetch.mock.calls
        .slice(1)
        .map((c: any) => c[1].headers['X-Retry-Count'])
      expect(retryCounts[0]).toBe('1')
    })

    it('T18 X-Retry-Count semantics', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 500 }))
        .mockReturnValueOnce(createError({ status: 500 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 5, timeout: 1000 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.runAllTimers()

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBeUndefined()
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T19 Authorization header is sent with Basic auth', async () => {
      fetch.mockReturnValue(createSuccess({}))

      const { dispatch } = batch(`https://api.segment.io`, { size: 1 })
      await dispatch(`https://api.segment.io/v1/t`, {
        writeKey: 'test-write-key',
        event: 'test',
      })

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['Authorization']).toBe(`Basic ${btoa('test-write-key:')}`)
    })

    it('T20 Retry-After capped at 300 seconds', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '500') // 500 seconds, should be capped at 300

      fetch
        .mockReturnValueOnce(createError({ status: 429, headers }))
        .mockReturnValue(createSuccess({}))

      // Use a high maxRateLimitDuration so the 300s capped delay isn't dropped
      const httpConfig = resolveHttpConfig({
        rateLimitConfig: { maxRateLimitDuration: 600 },
      })
      const { dispatch } = batch(
        `https://api.segment.io`,
        {
          size: 1,
          timeout: 1000,
          maxRetries: 1,
        },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      // Should wait exactly 300 seconds (capped), not 500
      jest.advanceTimersByTime(299999)
      expect(fetch).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('handles concurrent in-flight 429 responses without dropping either batch', async () => {
      const retryAfterHeaders = new Headers()
      retryAfterHeaders.set('Retry-After', '1')

      const pendingResponses: Array<(value: Response) => void> = []
      let callCount = 0

      fetch.mockImplementation(() => {
        callCount += 1

        if (callCount <= 2) {
          return new Promise<Response>((resolve) => {
            pendingResponses.push(resolve)
          })
        }

        return createSuccess({})
      })

      const httpConfig = resolveHttpConfig({
        rateLimitConfig: {
          maxRateLimitDuration: 600,
        },
      })

      const { dispatch } = batch(
        `https://api.segment.io`,
        {
          size: 1,
          timeout: 10,
          maxRetries: 3,
        },
        httpConfig
      )

      const dispatchA = dispatch(`https://api.segment.io/v1/t`, { event: 'a' })
      const dispatchB = dispatch(`https://api.segment.io/v1/t`, { event: 'b' })

      expect(fetch).toHaveBeenCalledTimes(2)

      const rateLimitedResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: retryAfterHeaders,
        json: () => Promise.resolve({}),
      } as Response

      pendingResponses[0](rateLimitedResponse)
      pendingResponses[1](rateLimitedResponse)
      await Promise.all([dispatchA, dispatchB])

      // Both 429s should schedule retries, but no new network call until Retry-After passes.
      expect(fetch).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(1000)
      await Promise.resolve()
      expect(fetch).toHaveBeenCalledTimes(3)

      const retriedPayload = JSON.parse(fetch.mock.calls[2][1].body)
      expect(retriedPayload.batch).toHaveLength(2)
      expect(
        retriedPayload.batch
          .map((event: { event: string }) => event.event)
          .sort()
      ).toEqual(['a', 'b'])

      // No additional request should be needed after successful combined retry.
      jest.advanceTimersByTime(10)
      await Promise.resolve()
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('T04 (SDD) 429 halts current flush iteration — remaining batches not attempted', async () => {
      const retryAfterHeaders = new Headers()
      retryAfterHeaders.set('Retry-After', '5')

      // First request gets 429, subsequent requests succeed
      fetch
        .mockReturnValueOnce(
          createError({ status: 429, headers: retryAfterHeaders })
        )
        .mockReturnValue(createSuccess({}))

      const httpConfig = resolveHttpConfig({
        rateLimitConfig: { maxRateLimitDuration: 600 },
      })

      // Use a large timeout so the timer-based flush won't interfere
      const { dispatch } = batch(
        `https://api.segment.io`,
        {
          size: 1,
          timeout: 60000,
          maxRetries: 3,
        },
        httpConfig
      )

      // First event triggers immediate flush (size=1)
      await dispatch(`https://api.segment.io/v1/t`, { event: 'a' })

      // First batch sent, got 429
      expect(fetch).toHaveBeenCalledTimes(1)

      // Now add another event while rate-limited
      await dispatch(`https://api.segment.io/v1/t`, { event: 'b' })

      // Advance less than the Retry-After period — no new requests should fire
      jest.advanceTimersByTime(3000)
      expect(fetch).toHaveBeenCalledTimes(1)

      // After the Retry-After delay (5s total), the pipeline resumes
      jest.advanceTimersByTime(2000)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('T19 (SDD) Gives up after maxTotalBackoffDuration elapsed', async () => {
      // All responses are 500 (retryable with backoff)
      fetch.mockReturnValue(createError({ status: 500 }))

      // Set a very short maxTotalBackoffDuration (10 seconds) for testing
      const httpConfig = resolveHttpConfig({
        backoffConfig: {
          maxTotalBackoffDuration: 10, // 10 seconds
          baseBackoffInterval: 5, // 5 seconds base
          maxBackoffInterval: 300,
          jitterPercent: 0, // no jitter for deterministic test
        },
      })

      const { dispatch } = batch(
        `https://api.segment.io`,
        {
          size: 1,
          timeout: 1000,
          maxRetries: 100, // high count so we hit duration limit first
        },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // First attempt
      expect(fetch).toHaveBeenCalledTimes(1)

      // First retry after ~5s backoff
      jest.advanceTimersByTime(5000)
      expect(fetch).toHaveBeenCalledTimes(2)

      // Second retry would need ~10s backoff (5 * 2^1), total = 5 + 10 = 15s > 10s limit
      // So the batch should be dropped and no further retries happen
      jest.runAllTimers()

      // Only 2 attempts total: initial + 1 retry (second retry exceeds duration limit)
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('T20 (SDD) Rate-limited state drops batch after maxRateLimitDuration exceeded', async () => {
      const retryAfterHeaders = new Headers()
      retryAfterHeaders.set('Retry-After', '60')

      // Keep returning 429
      fetch.mockReturnValue(
        createError({ status: 429, headers: retryAfterHeaders })
      )

      // Set a short maxRateLimitDuration for testing
      const httpConfig = resolveHttpConfig({
        rateLimitConfig: {
          maxRateLimitDuration: 100, // 100 seconds
          maxRetryCount: 1000, // high count so we hit duration limit first
        },
      })

      const { dispatch } = batch(
        `https://api.segment.io`,
        {
          size: 1,
          timeout: 1000,
        },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // First attempt: 429 with Retry-After: 60
      expect(fetch).toHaveBeenCalledTimes(1)

      // Wait for first Retry-After (60s) — totalRateLimitTime = 60s
      jest.advanceTimersByTime(60000)
      expect(fetch).toHaveBeenCalledTimes(2)

      // Second 429 with Retry-After: 60 — totalRateLimitTime would be 120s > 100s limit
      // Batch should be dropped, no more retries
      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('CDN httpConfig: statusCodeOverrides precedence', () => {
    it('drops 429 with Retry-After when statusCodeOverrides says drop', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '5')

      fetch.mockReturnValue(createError({ status: 429, headers }))

      const httpConfig = resolveHttpConfig({
        backoffConfig: {
          statusCodeOverrides: { '429': 'drop' },
        },
      })
      const { dispatch } = batch(
        `https://api.segment.io`,
        { size: 1, timeout: 1000 },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      // Should not retry — override says drop
      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('drops 503 when statusCodeOverrides overrides default 5xx retry', async () => {
      fetch.mockReturnValue(createError({ status: 503 }))

      const httpConfig = resolveHttpConfig({
        backoffConfig: {
          statusCodeOverrides: { '503': 'drop' },
        },
      })
      const { dispatch } = batch(
        `https://api.segment.io`,
        { size: 1, timeout: 1000 },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      // Should not retry — override says drop
      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('CDN httpConfig: maxRetryCount', () => {
    it('uses httpConfig maxRetryCount over delivery strategy maxRetries', async () => {
      fetch.mockReturnValue(createError({ status: 500 }))

      // httpConfig says maxRetryCount=1, but the delivery strategy doesn't set
      // maxRetries at all. The resolved httpConfig value should be used.
      const httpConfig = resolveHttpConfig({
        backoffConfig: {
          maxRetryCount: 1,
          jitterPercent: 0,
          baseBackoffInterval: 0.1,
        },
      })
      const { dispatch } = batch(
        `https://api.segment.io`,
        { size: 1, timeout: 60000 },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // Attempt 1 (initial)
      expect(fetch).toHaveBeenCalledTimes(1)

      // After timers run, only 1 retry (attempt 2) should occur,
      // then maxRetryCount=1 is exhausted (attempt <= maxRetries check
      // fails on the catch of attempt 2).
      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('CDN httpConfig: maxRetryInterval', () => {
    it('caps Retry-After to custom maxRetryInterval', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '10')

      fetch
        .mockReturnValueOnce(createError({ status: 429, headers }))
        .mockReturnValue(createSuccess({}))

      const httpConfig = resolveHttpConfig({
        rateLimitConfig: {
          maxRetryInterval: 3, // Cap at 3 seconds
          maxRateLimitDuration: 600,
        },
      })
      const { dispatch } = batch(
        `https://api.segment.io`,
        { size: 1, timeout: 60000 },
        httpConfig
      )

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      // Should wait 3s (capped), not 10s
      jest.advanceTimersByTime(2999)
      expect(fetch).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1)
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})
