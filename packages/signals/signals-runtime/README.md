# @segment/analytics-signals-runtime
Encapsulates Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Development
`yarn build` generate the following artifacts:
| Generated File(s) | Description | 
|--------|-------------|
| `/dist/runtime/index.[platform].js`, `/[platform]/get-runtime-code.generated.js` | Exposes `globalThis.Signals` and constants (e.g. `SignalType`), either through the script tag or in the mobile JS engine | 
| `/dist/editor/[platform]-editor.d.ts.txt` | Type definitions for monaco editor on app.segment.com 
| `/dist/esm/index.js` | Entry point for `@segment/analytics-signals` and the segment app, for consumers that want to consume the types / runtime code as an npm package. | 