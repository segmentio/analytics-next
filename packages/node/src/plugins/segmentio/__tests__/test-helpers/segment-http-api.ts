import { Context } from '../../../../app/context'

export const bodyPropertyMatchers = {
  messageId: expect.stringMatching(/^node-next-\d*-\w*-\w*-\w*-\w*-\w*/),
  timestamp: expect.stringMatching(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  ),
  _metadata: expect.any(Object),
  context: {
    library: {
      name: '@segment/analytics-node',
      version: expect.any(String),
    },
  },
  integrations: {},
}

export function assertSegmentApiBody(
  url: string,
  request: RequestInit,
  contexts: Context[]
) {
  const body = JSON.parse(request.body as string)
  expect(url).toBe('https://api.segment.io/v1/batch')
  expect(request.method).toBe('POST')
  expect(request.headers).toMatchInlineSnapshot(`
    Object {
      "Authorization": "Basic Og==",
      "Content-Type": "application/json",
      "User-Agent": "analytics-node-next/latest",
    }
  `)

  expect(body.batch).toHaveLength(contexts.length)
  for (let i = 0; i < contexts.length; i++) {
    expect(body.batch[i]).toEqual({
      ...contexts[i].event,
      ...bodyPropertyMatchers,
    })
  }
}
