#  @segment/analytics-signals 


## Settings / Configuration

See: [settings.ts](src/types/settings.ts)

## Quick start

## Snippet Users
```html
  <!-- Load SignalsPlugin -->
  <script src="https://cdn.jsdelivr.net/npm/@segment/analytics-signals@latest/dist/umd/analytics-signals.umd.js"></script>

  <!-- Load Segment (copy snippet from app.segment.com)  -->
  <script>
    !function(){var i="analytics",analytics=window[i]...  // etc
    analytics.load("<YOUR_WRITE_KEY>");
    analytics.page();
    }()
  </script>

 <!-- Register SignalsPlugin  -->
  <script>
    const signalsPlugin = new SignalsPlugin()
    analytics.register(signalsPlugin)
  </script>
```

## NPM Users
### Installation
```bash
# npm
npm install @segment/analytics-signals
# yarn
yarn add @segment/analytics-signals
# pnpm
pnpm install @segment/analytics-signals
```

```ts
// analytics.js/ts
import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'

export const analytics = new AnalyticsBrowser()
export const signalsPlugin = new SignalsPlugin()

analytics.register(signalsPlugin)

analytics.load({
  writeKey: '<YOUR_WRITE_KEY>'
})

```
### Extending / Emitting Custom Signals
```ts
import { signalsPlugin } from './analytics' // assuming you exported your plugin instance.

signalsPlugin.addSignal({
  type: 'userDefined',
  data: { foo: 'bar' }
})
```

### Debugging
#### Enable debug mode
Values sent to the signals API are redacted by default.
This adds a local storage key.  To disable redaction, add a magic query string:
```
https://my-website.com?segment_signals_debug=true
```
You can *turn off debugging* by doing:
```
https://my-website.com?segment_signals_debug=false
```

### Advanced

#### Listening to signals
```ts
const signalsPlugin = new SignalsPlugin()

signalsPlugin.onSignal((signal) => console.log(signal))
```


### Playground / Development / Testing
See the [signals example repo](../signals-example).

## Signal Types

### `interaction`
Interaction signals emit in response to a user interaction

### `instrumentation`
Instrumentation signals emit whenever a Segment event is emitted.

### `navigation`
Instrumentation signals emit whenever the URL changes.

> Note: you can also rely on the initial analytics.page() call, which you can access as an Instrumentation signal.

### `network`
Network signals emit when an HTTP Request is made, or an HTTP Response is received. To emit a network signal, the network activity must have the following requirements:
- Initiated using the `fetch` API
- First party domain (e.g if on `foo.com`, then `foo.com/api/products`, but not `bar.com/api/products`)
- Contains the content-type: `application/json`

