# @segment/analytics-signals-runtime
Encapsults Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Development
`yarn build` generate the following artifacts:
| Artifact | Description | 
|--------|-------------|
|  `/dist/cjs/index.js` | For npm library users |
| `/dist/esm/index.js` | For npm library users | 
| `/dist/global/index.js`  | Bundle that `globalThis.SignalsRuntime` | 
| `./dist/global/editor/*.d.ts` | Runtime artifacts for powering autocomplete on app.segment.com |