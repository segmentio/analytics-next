// create a derived class since we may want to add node specific things to Context later

import { CoreContext } from '@customerio/cdp-analytics-core'
import { CustomerioEvent } from './types'

// While this is not a type, it is a definition
export class Context extends CoreContext<CustomerioEvent> {
  static override system() {
    return new this({ type: 'track', event: 'system' })
  }
}
