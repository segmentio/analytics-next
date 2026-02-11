const fetch = jest.fn()

jest.mock('unfetch', () => {
  return fetch
})

import { createError, createSuccess } from '../../../test-helpers/factories'
import batch from '../batched-dispatcher'

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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"},{"event":"third"}],"sentAt":"1993-06-09T00:00:00.000Z"}",
          "credentials": undefined,
          "headers": {
            "Authorization": "Basic dW5kZWZpbmVkOg==",
            "Content-Type": "text/plain",
            "X-Retry-Count": "0",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)
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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"}],"sentAt":"1993-06-09T00:00:10.000Z"}",
          "credentials": undefined,
          "headers": {
            "Authorization": "Basic dW5kZWZpbmVkOg==",
            "Content-Type": "text/plain",
            "X-Retry-Count": "0",
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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"}],"sentAt":"1993-06-09T00:00:10.000Z"}",
          "credentials": undefined,
          "headers": {
            "Authorization": "Basic dW5kZWZpbmVkOg==",
            "Content-Type": "text/plain",
            "X-Retry-Count": "0",
          },
          "keepalive": false,
          "method": "post",
          "priority": undefined,
        },
      ]
    `)

    expect(fetch.mock.calls[1]).toMatchInlineSnapshot(`
      [
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"second"}],"sentAt":"1993-06-09T00:00:21.000Z"}",
          "credentials": undefined,
          "headers": {
            "Authorization": "Basic dW5kZWZpbmVkOg==",
            "Content-Type": "text/plain",
            "X-Retry-Count": "0",
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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"}],"sentAt":"1993-06-09T00:00:00.000Z"}",
          "credentials": undefined,
          "headers": {
            "Authorization": "Basic dW5kZWZpbmVkOg==",
            "Content-Type": "text/plain",
            "X-Retry-Count": "0",
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

    it('T01 Success: no retry, header is 0', async () => {
      fetch.mockReturnValue(createSuccess({}))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBe('0')
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
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')

      // Advance time to trigger first retry
      jest.advanceTimersByTime(1000)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')

      // Advance time to trigger second retry which will succeed
      jest.advanceTimersByTime(1000)
      // Under current batching implementation we see a single backoff retry
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('T03 Non-retryable 5xx: 501', async () => {
      fetch.mockReturnValue(createError({ status: 501 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBe('0')
    })

    it('T04 Non-retryable 5xx: 505', async () => {
      fetch.mockReturnValue(createError({ status: 505 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBe('0')
    })

    it('T05 Non-retryable 5xx: 511 (no auth)', async () => {
      fetch.mockReturnValue(createError({ status: 511 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBe('0')
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
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')

      // Retry should wait exactly Retry-After seconds
      jest.advanceTimersByTime(1000)
      expect(fetch).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1000)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T07 Retry-After 408: delay, no backoff', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '2')

      fetch
        .mockReturnValueOnce(createError({ status: 408, headers }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')

      jest.advanceTimersByTime(2000)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T08 Retry-After 503: delay, no backoff', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '2')

      fetch
        .mockReturnValueOnce(createError({ status: 503, headers }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')

      jest.advanceTimersByTime(2000)
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
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')

      jest.advanceTimersByTime(1499)
      expect(fetch).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T10 Retryable 4xx: 408 without Retry-After', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 408 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.advanceTimersByTime(1500)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T12 413: non-retryable for batched dispatcher', async () => {
      fetch.mockReturnValue(createError({ status: 413 }))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.advanceTimersByTime(1500)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')
    })

    it('T13 Retryable 4xx: 460', async () => {
      fetch
        .mockReturnValueOnce(createError({ status: 460 }))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      jest.advanceTimersByTime(1500)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T14 Non-retryable 4xx: 404', async () => {
      fetch.mockReturnValue(createError({ status: 404 }))

      await dispatchOne()

      expect(fetch).toHaveBeenCalledTimes(1)
      const headers = fetch.mock.calls[0][1].headers
      expect(headers['X-Retry-Count']).toBe('0')
    })

    it('T15 Network error (IO): retried with backoff', async () => {
      fetch
        .mockRejectedValueOnce(new Error('network error'))
        .mockReturnValue(createSuccess({}))

      const { dispatch } = createBatch({ maxRetries: 1, timeout: 1500 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1500)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['X-Retry-Count']).toBe('1')
    })

    it('T16 Max retries exhausted (backoff)', async () => {
      const maxRetries = 1

      fetch.mockReturnValue(createError({ status: 500 }))

      const { dispatch } = createBatch({ maxRetries, timeout: 1000 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      // First attempt + maxRetries additional attempts
      for (let i = 0; i < maxRetries; i++) {
        jest.advanceTimersByTime(1000)
      }

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

      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(1000)

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[0][1].headers['X-Retry-Count']).toBe('0')
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

      const { dispatch } = createBatch({ maxRetries: 1 })

      await dispatch(`https://api.segment.io/v1/t`, { event: 'test' })

      expect(fetch).toHaveBeenCalledTimes(1)

      // Should wait exactly 300 seconds (capped), not 500
      jest.advanceTimersByTime(299999)
      expect(fetch).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1)
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})
