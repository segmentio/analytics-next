import { Context } from '../../../app/context'
import { HTTPClientRequest } from '../../../lib/http-client'

/**
 * These map to the data properties of the HTTPClient options (the input value of 'makeRequest')
 */
export const httpClientOptionsBodyMatcher = {
  messageId: expect.stringMatching(/^node-next-\d*-\w*-\w*-\w*-\w*-\w*/),
  timestamp: expect.any(Date),
  _metadata: expect.any(Object),
  context: {
    library: {
      name: '@segment/analytics-node',
      version: expect.any(String),
    },
  },
  integrations: {},
}

export function assertHTTPRequestOptions(
  { body, headers, method, url }: HTTPClientRequest,
  contexts: Context[]
) {
  expect(url).toBe('https://api.segment.io/v1/batch')
  expect(method).toBe('POST')
  expect(headers).toMatchInlineSnapshot(`
    Object {
      "Content-Type": "application/json",
      "User-Agent": "analytics-node-next/latest",
    }
  `)
  //expect(body).toHaveLength(contexts.length)
}
