const fetch = jest.fn()

jest.mock('../fetch-dispatcher', () => {
  return () => ({ dispatch: fetch })
})

import batch from '../batched-dispatcher'

describe('Batching', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
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
      Array [
        "https://https://api.segment.io/b",
        Array [
          Object {
            "event": "first",
          },
          Object {
            "event": "second",
          },
          Object {
            "event": "third",
          },
        ],
      ]
    `)
  })

  it('sends requests when the timeout expires', async () => {
    jest.useFakeTimers()

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
      Array [
        "https://https://api.segment.io/b",
        Array [
          Object {
            "event": "first",
          },
          Object {
            "event": "second",
          },
        ],
      ]
    `)
  })

  it('clears the buffer between flushes', async () => {
    jest.useFakeTimers()

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
      Array [
        "https://https://api.segment.io/b",
        Array [
          Object {
            "event": "first",
          },
        ],
      ]
    `)

    expect(fetch.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        "https://https://api.segment.io/b",
        Array [
          Object {
            "event": "second",
          },
        ],
      ]
    `)
  })
})
