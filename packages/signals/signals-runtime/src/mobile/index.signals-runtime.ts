import * as Constants from './mobile-constants'
import { MobileSignalsRuntime } from './mobile-signals-runtime'

// assign SignalsRuntime and all constants to globalThis
// meant to replace this:
// https://github.com/segmentio/SignalsJS-Runtime/blob/main/Runtime/Signals.js
Object.assign(
  globalThis,
  {
    signals: new MobileSignalsRuntime(),
  },
  Constants
)
