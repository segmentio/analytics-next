import { Signal } from '@segment/analytics-signals-runtime'
import { UserInfo } from '../../../types'
import { SignalsMiddleware, SignalsMiddlewareContext } from '../../emitter'

export class UserInfoMiddleware implements SignalsMiddleware {
  user!: UserInfo

  async load(ctx: SignalsMiddlewareContext) {
    this.user = await ctx.analyticsInstance.user()
  }

  process(signal: Signal): Signal {
    // anonymousId should always exist here unless the user is explicitly setting it to null
    signal.anonymousId = this.user.anonymousId()
    return signal
  }
}
