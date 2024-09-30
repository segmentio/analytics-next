# @segment/analytics-consent-tools

## Quick Start

```ts
// wrapper.js
import { createWrapper, resolveWhen } from '@segment/analytics-consent-tools'

export const withCMP = createWrapper({
  // Wait to load wrapper or call "shouldLoadSegment" until window.CMP exists.
  shouldLoadWrapper: async () => {
    await resolveWhen(() => window.CMP !== undefined, 500)
  },

  // Allow for control over wrapper + analytics initialization.
  // Delay any calls to analytics.load() until this function returns / resolves.
  shouldLoadSegment: async (ctx) => {
    /*
    // Optional -- for granular control of initialization
    if (noConsentNeeded) {
      ctx.abort({ loadSegmentNormally: true })
    } else if (allTrackingDisabled) {
      ctx.abort({ loadSegmentNormally: false })
    }
    */
    if (window.CMP.ConsentModel === 'opt-out') {
      return ctx.load({ consentModel: 'opt-out' })
    } else {
      await resolveWhen(
        () => !window.CMP.popUpVisible() && window.CMP.categories.length,
        500
      )
      return ctx.load({ consentModel: 'opt-in' })
    }
  },

  getCategories: () => {
    return normalizeCategories(window.CMP.consentedCategories()) // Expected format: { foo: true, bar: false }
  },

  registerOnConsentChanged: (setCategories) => {
    window.CMP.onConsentChanged((event) => {
      setCategories(normalizeCategories(event.detail))
    })
  },
})
```

### Settings / Configuration

See: [settings.ts](src/types/settings.ts)

### Consent Models

The wrapper has different behavior based on the consent-model:

- **opt-in** - (strict, GDPR scenario) -- Unconsented device mode destinations are removed
- **opt-out** - Device mode destinations are loaded, but with blocking middleware

## Wrapper Usage API

## `npm`

```js
import { withCMP } from './wrapper'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

withCMP(analytics).load({
  writeKey: '<MY_WRITE_KEY'>
})

```

## Snippet users (window.analytics)

### Note: This assumes a project that can consume the library via es6 imports, using a like Webpack.

1. Delete the `analytics.load()` line from the snippet

```diff
- analytics.load("<MY_WRITE_KEY>");
```

2. Import Analytics

```js
import { withCMP } from './wrapper'

withCMP(window.analytics).load('<MY_WRITE_KEY')
```

## Wrapper Examples

- [OneTrust](../consent-wrapper-onetrust) 
- [TrustArc](https://github.com/trustarc/trustarc-segment-wrapper)

## Settings / Options / Configuration

See the complete list of settings in the **[Settings interface](src/types/settings.ts)**

## Special Requirements

- For npm users, this library expects a version of `@segment/analytics-next` >= **1.53.1**. Note: If your library depends on this library, you should have the appropriate peer dependency declaration. See our `package.json` for an example.

## Development

1. Build this package + all dependencies

```sh
yarn . build
```

2. Run tests

```
yarn test
```
