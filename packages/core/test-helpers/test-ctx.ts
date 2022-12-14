import { CoreContext } from '../src/context'

export class TestCtx extends CoreContext {
  static override system() {
    return new this({ type: 'track', event: 'system' })
  }
}
