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

  it('makes a track call via the analytics api', async () => {
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
          foo: 'XXX',
        },
      },
    })
  })
})
