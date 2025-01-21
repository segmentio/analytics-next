const fetch = jest.fn()

jest.mock('unfetch', () => {
  return fetch
})

import { createSuccess } from '../../../test-helpers/factories'
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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"}],"sentAt":"1993-06-09T00:00:10.000Z"}",
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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"second"}],"sentAt":"1993-06-09T00:00:21.000Z"}",
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
        "https://https://api.segment.io/b",
        {
          "body": "{"batch":[{"event":"first"},{"event":"second"}],"sentAt":"1993-06-09T00:00:00.000Z"}",
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
})
