const fetch = jest.fn()

jest.mock('unfetch', () => {
  return fetch
})

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
    jest.useFakeTimers()
  })

  afterEach(() => {
    // clear any pending sendBatch calls
    jest.runAllTimers()
    jest.useRealTimers()
  })

  it('does not send requests right away', async () => {
    const { dispatch } = batch(`https://cdp.customer.io`)

    await dispatch(`https://cdp.customer.io/v1/t`, {
      hello: 'world',
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends requests after a batch limit is hit', async () => {
    const { dispatch } = batch(`https://cdp.customer.io`, {
      size: 3,
    })

    await dispatch(`https://cdp.customer.io/v1/t`, {
      event: 'first',
    })
    expect(fetch).not.toHaveBeenCalled()

    await dispatch(`https://cdp.customer.io/v1/t`, {
      event: 'second',
    })
    expect(fetch).not.toHaveBeenCalled()

    await dispatch(`https://cdp.customer.io/v1/t`, {
      event: 'third',
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "https://cdp.customer.io/b",
        Object {
          "body": "{\\"batch\\":[{\\"event\\":\\"first\\"},{\\"event\\":\\"second\\"},{\\"event\\":\\"third\\"}]}",
          "headers": Object {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
        },
      ]
    `)
  })

  it('sends requests if the size of events exceeds tracking API limits', async () => {
    const { dispatch } = batch(`https://cdp.customer.io`, {
      size: 600,
    })

    // fatEvent is about ~1kb in size
    for (let i = 0; i < 250; i++) {
      await dispatch(`https://cdp.customer.io/v1/t`, {
        event: 'fat event',
        properties: fatEvent,
      })
    }
    expect(fetch).not.toHaveBeenCalled()

    for (let i = 0; i < 250; i++) {
      await dispatch(`https://cdp.customer.io/v1/t`, {
        event: 'fat event',
        properties: fatEvent,
      })
    }

    // still called, even though our batch limit is 600 events
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends requests when the timeout expires', async () => {
    const { dispatch } = batch(`https://cdp.customer.io`, {
      size: 100,
      timeout: 10000, // 10 seconds
    })

    await dispatch(`https://cdp.customer.io/v1/t`, {
      event: 'first',
    })
    expect(fetch).not.toHaveBeenCalled()

    await dispatch(`https://cdp.customer.io/v1/i`, {
      event: 'second',
    })

    jest.advanceTimersByTime(11000) // 11 seconds

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "https://cdp.customer.io/b",
        Object {
          "body": "{\\"batch\\":[{\\"event\\":\\"first\\"},{\\"event\\":\\"second\\"}]}",
          "headers": Object {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
        },
      ]
    `)
  })

  it('clears the buffer between flushes', async () => {
    const { dispatch } = batch(`https://cdp.customer.io`, {
      size: 100,
      timeout: 10000, // 10 seconds
    })

    await dispatch(`https://cdp.customer.io/v1/t`, {
      event: 'first',
    })

    jest.advanceTimersByTime(11000) // 11 seconds

    await dispatch(`https://cdp.customer.io/v1/i`, {
      event: 'second',
    })

    jest.advanceTimersByTime(11000) // 11 seconds

    expect(fetch).toHaveBeenCalledTimes(2)

    expect(fetch.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "https://cdp.customer.io/b",
        Object {
          "body": "{\\"batch\\":[{\\"event\\":\\"first\\"}]}",
          "headers": Object {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
        },
      ]
    `)

    expect(fetch.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        "https://cdp.customer.io/b",
        Object {
          "body": "{\\"batch\\":[{\\"event\\":\\"second\\"}]}",
          "headers": Object {
            "Content-Type": "text/plain",
          },
          "keepalive": false,
          "method": "post",
        },
      ]
    `)
  })

  describe('on unload', () => {
    it('flushes the batch', async () => {
      const { dispatch } = batch(`https://cdp.customer.io`)

      dispatch(`https://cdp.customer.io/v1/t`, {
        hello: 'world',
      }).catch(console.error)

      dispatch(`https://cdp.customer.io/v1/t`, {
        bye: 'world',
      }).catch(console.error)

      expect(fetch).not.toHaveBeenCalled()

      window.dispatchEvent(new Event('pagehide'))

      expect(fetch).toHaveBeenCalledTimes(1)

      // any dispatch attempts after the page has unloaded are flushed immediately
      // this can happen if analytics.track is called right before page is navigated away
      dispatch(`https://cdp.customer.io/v1/t`, {
        afterlife: 'world',
      }).catch(console.error)

      // no queues, no waiting, instatneous
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('flushes in batches of no more than 64kb', async () => {
      const { dispatch } = batch(`https://cdp.customer.io`, {
        size: 1000,
      })

      // fatEvent is about ~1kb in size
      for (let i = 0; i < 80; i++) {
        await dispatch(`https://cdp.customer.io/v1/t`, {
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
