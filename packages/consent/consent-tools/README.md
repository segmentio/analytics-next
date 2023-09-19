# @segment/analytics-consent-tools

## Quick Start

```ts
// wrapper.js
import { createWrapper, resolveWhen, RegisterOnConsentChangedFunction } from '@segment/analytics-consent-tools'

export const withCMP = createWrapper({

  // Do not attempt to load segment until this function returns / resolves
  shouldLoad: (ctx) => {
    const CMP = await getCMP()
    await resolveWhen(
      () => !CMP.popUpVisible(),
      500
    )

    // Optional -- for granular control of initialization
    if (noConsentNeeded) {
      ctx.abort({ loadSegmentNormally: true })
    } else if (allTrackingDisabled) {
      ctx.abort({ loadSegmentNormally: false })
    }
  },

  getCategories: () => {
    const CMP = await getCMP()
    return normalizeCategories(CMP.consentedCategories()) // Expected format: { foo: true, bar: false }
  },

  registerOnConsentChanged: (setCategories) => {
    const CMP = await getCMP()
    CMP.onConsentChanged((event) => {
      setCategories(normalizeCategories(event.detail))
    })
  },
})


const getCMP = async () => {
 await resolveWhen(() => window.CMP !== undefined, 500)
 return window.CMP
}
```

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

- [OneTrust](../consent-wrapper-onetrust) (beta)

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
