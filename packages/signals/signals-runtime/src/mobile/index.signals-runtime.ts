import * as Constants from './mobile-constants'
import { Signals } from './mobile-signals-runtime'

// assign SignalsRuntime and all constants to globalThis
Object.assign(
  globalThis,
  {
    Signals,
  },
  Constants
)
