# @segment/analytics-signals-runtime
Encapsults Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Development
`yarn build` generate the following artifacts:
| Generated File(s) | Description | 
|--------|-------------|
| `/dist/esm/index.js` | For `@segment/analytics-signals` to consume | 
| `/dist/global/index.[web/mobile].js` |  Exposes `globalThis.Signals` and constants (e.g. `SignalType`), either through the script tag or in the mobile JS engine. Meant to be uploaded to a CDN and shared in each SDK | 
| `/dist/global/get-runtime-string.[web/mobile].js` | Exposes a function that returns the signals runtime as string (see `index.[web/mobile].js`) | 
| `/editor/[web/mobile]-editor.d.ts` | Type definitions for monaco editor on app.segment.com |