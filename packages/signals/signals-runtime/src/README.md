# @segment/analytics-signals-runtime
Encapsults Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Development
`yarn build` generate the following artifacts:
| Generated File(s) | Description | 
|--------|-------------|
| `/dist/esm/index.js` | For `@segment/analytics-signals` to consume | 
| `/dist/global/index.js`  |  Exposes `globalThis.SignalsRuntime`, either through the script tag or in the mobile JS engine. | 
| `/dist/editor/*.d.ts` | Runtime artifacts for powering autocomplete on app.segment.com |