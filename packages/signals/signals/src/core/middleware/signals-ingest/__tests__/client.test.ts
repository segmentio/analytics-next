import { ISO_TIMESTAMP_REGEX } from '@internal/test-helpers'
import { createSuccess } from '@segment/analytics-next/src/test-helpers/factories'
import unfetch from 'unfetch'
import { getPageData } from '../../../../lib/page-data'
import {
  createInstrumentationSignal,
  createNetworkSignal,
} from '../../../../types/factories'
import { SignalsIngestClient } from '../signals-ingest-client'

jest.mock('unfetch')
jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

describe(SignalsIngestClient, () => {
  let client: SignalsIngestClient

  beforeEach(async () => {
    client = new SignalsIngestClient('test', {
      shouldIngestSignals: () => true,
    })
  })

  it('makes an instrumentation track call via the analytics api', async () => {
    expect(client).toBeTruthy()
    const signal = createInstrumentationSignal({
      type: 'track',
    })
    const ctx = await client.send(signal)

    expect(ctx!.event.type).toEqual('track')
    expect(ctx!.event.properties).toMatchObject({
      anonymousId: expect.any(String),
      timestamp: expect.stringMatching(ISO_TIMESTAMP_REGEX),
      type: 'instrumentation',
      index: 0,
      data: {
        rawEvent: {
          type: 'track',
        },
        page: getPageData(),
      },
    })
  })
  it('makes a network track call via the analytics api', async () => {
    expect(client).toBeTruthy()
    const signal = createNetworkSignal({
      requestId: '12345',
      contentType: 'application/json',
      action: 'request',
      body: {
        hello: 'how are you',
      },
      method: 'POST',
      url: 'http://foo.com',
    })

    const ctx = await client.send(signal)
    expect(ctx!.event.properties!).toMatchInlineSnapshot(`
      {
        "anonymousId": "",
        "context": {
          "library": {
            "name": "@segment/analytics-next",
            "version": "0.0.0",
          },
          "signalsRuntime": "",
        },
        "data": {
          "action": "request",
          "body": {
            "hello": "XXX",
          },
          "contentType": "application/json",
          "method": "POST",
          "page": {
            "hash": "",
            "hostname": "localhost",
            "path": "/",
            "referrer": "",
            "search": "",
            "title": "",
            "url": "http://localhost/",
          },
          "requestId": "12345",
          "url": "http://foo.com",
        },
        "index": 0,
        "timestamp": <ISO Timestamp>,
        "type": "network",
      }
    `)
  })
})
