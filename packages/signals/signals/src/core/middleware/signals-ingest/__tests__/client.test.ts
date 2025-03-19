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
      contentType: 'application/json',
      action: 'request',
      data: {
        hello: 'how are you',
      },
      method: 'POST',
      url: 'http://foo.com',
    })

    const ctx = await client.send(signal)
    expect(ctx!.event.properties!).toMatchInlineSnapshot(`
      {
        "anonymousId": "",
        "data": {
          "action": "request",
          "contentType": "application/json",
          "data": {
            "hello": "XXX",
          },
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
          "url": "http://foo.com",
        },
        "index": 0,
        "metadata": {
          "filters": {
            "allowed": [],
            "disallowed": [],
          },
        },
        "timestamp": <ISO Timestamp>,
        "type": "network",
      }
    `)
  })
})
