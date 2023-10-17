/// <reference types="@cloudflare/workers-types" />
import { Analytics } from '@segment/analytics-node'

export default {
  async fetch(request: Request, _env: {}, _ctx: ExecutionContext) {
    const url = new URL(request.url)
    const maxEventsInBatch = parseInt(
      url.searchParams.get('maxEventsInBatch') ?? '15',
      10
    )
    const eventCount = parseInt(url.searchParams.get('eventCount') ?? '1', 10)
    const analytics = new Analytics({
      writeKey: '__TEST__',
      host: 'http://localhost:3000',
      maxEventsInBatch,
    })

    for (let i = 0; i < eventCount; i++) {
      analytics.track({
        userId: 'some-user',
        event: 'some-event',
        properties: { count: i },
      })
    }

    await analytics.closeAndFlush()
    return new Response('ok')
  },
}
