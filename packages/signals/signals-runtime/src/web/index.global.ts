import { Signals } from './web-signals-runtime'
import * as Constants from '../web/web-constants'

// assign SignalsRuntime and all constants to globalThis
Object.assign(
  globalThis,
  {
    Signals,
  },
  Constants
)
