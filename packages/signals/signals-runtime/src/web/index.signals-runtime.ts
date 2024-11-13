import { WebSignalsRuntime } from './web-signals-runtime'
import * as Constants from './web-constants'

// assign SignalsRuntime and all constants to globalThis
Object.assign(
  globalThis,
  {
    signals: new WebSignalsRuntime(),
  },
  Constants
)
