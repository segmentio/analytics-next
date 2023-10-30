/// <reference types="@cloudflare/workers-types" />
import { Analytics } from '@segment/analytics-node'

export default {
  async fetch(_request: Request, _env: {}, _ctx: ExecutionContext) {
    const analytics = new Analytics({
      writeKey: '__TEST__',
      host: 'http://localhost:3000',
    })

    analytics.track({ userId: 'some-user', event: 'some-event' })

    await analytics.closeAndFlush()
    return new Response('ok')
  },
}
