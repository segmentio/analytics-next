import { Signal } from '@segment/analytics-signals-runtime'
import { SignalsSubscriber, SignalsMiddlewareContext } from '../../emitter'
import { SignalsIngestClient } from './signals-ingest-client'

export class SignalsIngestSubscriber implements SignalsSubscriber {
  client!: SignalsIngestClient
  ctx!: SignalsMiddlewareContext
  load(ctx: SignalsMiddlewareContext) {
    this.ctx = ctx
    this.client = new SignalsIngestClient(
      ctx.analyticsInstance.settings.writeKey,
      ctx.unstableGlobalSettings.ingestClient
    )
  }
  process(signal: Signal) {
    void this.client.send(signal)
  }
}
