import { Context } from '../../../../app/context'
import { HTTPRequestOptions } from '../../../../lib/http-client'

export const bodyPropertyMatchers = {
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
  { data, headers, method, url }: HTTPRequestOptions,
  contexts: Context[]
) {
  expect(url).toBe('https://api.segment.io/v1/batch')
  expect(method).toBe('POST')
  expect(headers).toMatchInlineSnapshot(`
    Object {
      "Authorization": "Basic Og==",
      "Content-Type": "application/json",
      "User-Agent": "analytics-node-next/latest",
    }
  `)

  expect(data.batch).toHaveLength(contexts.length)
  let idx = 0
  for (const context of contexts) {
    expect(data.batch[idx]).toEqual({
      ...context.event,
      ...bodyPropertyMatchers,
    })
    idx += 1
  }
}
