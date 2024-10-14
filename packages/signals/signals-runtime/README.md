# @segment/analytics-signals-runtime
Encapsults Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Development
`yarn build` generate the following artifacts:
| Generated File(s) | Description | 
|--------|-------------|
| `/dist/esm/index.js` | For `@segment/analytics-signals` to consume | 
| `/dist/global/index.mobile.js, `/dist/global/index.web.js`  |  Exposes `globalThis.SignalsRuntime` and constants, either through the script tag or in the mobile JS engine. Meant to be uploaded to a CDN and shared in each SDK | 
| `/editor/mobile-editor.d.ts`, `/editor/web-editor.d.ts` | Type definitions for monaco editor on app.segment.com |