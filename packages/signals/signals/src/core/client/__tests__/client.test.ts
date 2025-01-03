import { SignalsIngestClient } from '../index'
import { createSuccess } from '@segment/analytics-next/src/test-helpers/factories'
import unfetch from 'unfetch'

jest.mock('unfetch')
jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

describe(SignalsIngestClient, () => {
  let client: SignalsIngestClient

  beforeEach(async () => {
    client = new SignalsIngestClient({
      shouldIngestSignals: () => true,
    })
    await client.init({ writeKey: 'test' })
  })

  it('makes an instrumentation track call via the analytics api', async () => {
    expect(client).toBeTruthy()
    const ctx = await client.send({
      type: 'instrumentation',
      data: {
        rawEvent: {
          foo: 'bar',
        },
      },
    })

    expect(ctx!.event.type).toEqual('track')
    expect(ctx!.event.properties).toEqual({
      type: 'instrumentation',
      index: 0,
      data: {
        rawEvent: {
          foo: 'bar',
        },
      },
    })
  })
  it('makes a network track call via the analytics api', async () => {
    expect(client).toBeTruthy()
    const ctx = await client.send({
      type: 'network',
      data: {
        contentType: 'application/json',
        action: 'request',
        data: {
          hello: 'how are you',
        },
        method: 'POST',
        url: 'http://foo.com',
      },
    })

    expect(ctx!.event.type).toEqual('track')
    expect(ctx!.event.properties!.type).toBe('network')
    expect(ctx!.event.properties!.data).toMatchInlineSnapshot(`
      {
        "action": "request",
        "contentType": "application/json",
        "data": {
          "hello": "XXX",
        },
        "method": "POST",
        "url": "http://foo.com",
      }
    `)
  })
})
