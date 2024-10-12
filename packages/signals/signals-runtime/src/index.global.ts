import { SignalsRuntime } from './index'

// the purpose of this is to create an artifact that can be uploaded to a CDN used in the mobile runtime, as well as the editor browser.
// the web version can use this package directly.
Object.assign(globalThis, { SignalsRuntime })
