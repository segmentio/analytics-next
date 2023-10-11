/// <reference types="@cloudflare/workers-types" />
import { Analytics } from '@segment/analytics-node'

export default {
  async fetch(_request: Request, _env: {}, _ctx: ExecutionContext) {
    const analytics = new Analytics({
      writeKey: '__TEST__',
      host: 'http://localhost:3000',
    })

    analytics.alias({ userId: 'some-user', previousId: 'other-user' })
    analytics.group({ userId: 'some-user', groupId: 'some-group' })
    analytics.identify({
      userId: 'some-user',
      traits: { favoriteColor: 'Seattle Grey' },
    })
    analytics.page({ userId: 'some-user', name: 'Test Page' })
    analytics.track({ userId: 'some-user', event: 'some-event' })
    analytics.screen({ userId: 'some-user', name: 'Test Screen' })

    await analytics.closeAndFlush()
    return new Response('ok')
  },
}
