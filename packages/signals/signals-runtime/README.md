# @segment/analytics-signals-runtime
Encapsults Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Development
`yarn build` generate the following artifacts:
| Generated File(s) | Description | 
|--------|-------------|
| `/dist/global/index.[platform].js`, `/[platform]/get-runtime-string.js` | Exposes `globalThis.Signals` and constants (e.g. `SignalType`), either through the script tag or in the mobile JS engine | 
| `/editor/[platform]-editor.d.ts` | Type definitions for monaco editor on app.segment.com 
| `/dist/esm/index.js` | Entry point for `@segment/analytics-signals` and the segment app, that want to consume the types / runtime code. | 