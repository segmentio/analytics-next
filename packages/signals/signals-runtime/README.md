# @segment/analytics-signals-runtime
Encapsulates Signals runtime functionality, in order to share logic between the signals plugins for browser and mobile.

### Installation
```bash
# npm
npm install @segment/analytics-signals-runtime
# yarn
yarn add @segment/analytics-signals-runtime
# pnpm
pnpm install @segment/analytics-signals-runtime
```

### Usage

### Importing the signals runtime as a module (e.g. `signals.find()`)

```ts
import { WebSignalsRuntime, Signal } from  '@segment/analytics-signals-runtime'
// MobileSignalsRuntime
// WebRuntimeConstants,
// MobileRuntimeConstants,

const mockSignalBuffer: Signal[] = [{
  type: "network",
  data: {
    action: "response",
    url: "https://segment-integrations.github.io/segment-shop-auto/cart",
    data: { foo: "bar" },
    ok: true,
    status: 201,
    contentType: "application/json",
    page: {
      path: "/segment-shop-auto/",
      referrer: "",
      title: "Segment Shop - Home Collection - Timecraft",
      search: "",
      url: "https://segment-integrations.github.io/segment-shop-auto/#/home-collection/Timecraft",
      hostname: "segment-integrations.github.io",
      hash: "#/home-collection/Timecraft"
    }
  }
}]

const signals = new WebSignalsRuntime(mockSignalBuffer)

const networkSignal = signals.find(null, 'network')

```
### Importing the signals runtime a JS string
```ts
import { getRuntimeCode, getMobileRuntimeCode } from '@segment/analytics-signals-runtime'

eval(`
 ${getMobileRuntimeCode()}
 signals.signalBuffer = [....]
 `)
```

### API documentation
For all exports, explore [the index.ts](src/index.ts).

### Development
`yarn build` generate the following artifacts:
| Generated File(s) | Description | 
|--------|-------------|
| `/dist/runtime/index.[platform].js`, `/[platform]/get-runtime-code.generated.js` | Exposes `globalThis.Signals` and constants (e.g. `SignalType`), either through the script tag or in the mobile JS engine | 
| `/dist/editor/[platform]-editor.d.ts.txt` | Type definitions for monaco editor on app.segment.com 
| `/dist/esm/index.js` | Entry point for `@segment/analytics-signals` and the segment app, for consumers that want to consume the types / runtime code as an npm package. | 
