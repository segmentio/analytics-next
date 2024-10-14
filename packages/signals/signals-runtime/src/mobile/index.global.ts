import { SignalsRuntime } from '../shared/signals-runtime'
import * as Constants from '../web/web-constants'

// assign SignalsRuntime and all constants to globalThis
Object.assign(
  globalThis,
  {
    SignalsRuntime,
  },
  Constants
)
