# @segment/analytics-consent-tools

## Quick Start

```ts
// wrapper.js
import { createWrapper, resolveWhen } from '@segment/analytics-consent-tools'

export const withCMP = createWrapper({
  shouldLoad: (ctx) => {
    await resolveWhen(
      () => window.CMP !== undefined && !window.CMP.popUpVisible(),
      500
    )

    if (noConsentNeeded) {
      ctx.abort({ loadSegmentNormally: true })
    } else if (allTrackingDisabled) {
      ctx.abort({ loadSegmentNormally: false })
    }
  },
  getCategories: () => {
    // e.g. { Advertising: true, Functional: false }
    return normalizeCategories(window.CMP.consentedCategories())
  },
})
```

## Wrapper Usage API

## `npm`

```js
import { withCMP } from './wrapper'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

withCMP(analytics)

analytics.load({
  writeKey: '<MY_WRITE_KEY'>
})

```

## Snippet users (window.analytics)

1. Delete the `analytics.load()` line from the snippet

```diff
- analytics.load("<MY_WRITE_KEY>");
```

2. Import Analytics

```js
import { withCMP } from './wrapper'

withCMP(window.analytics)

window.analytics.load('<MY_WRITE_KEY')
```

## Wrapper Examples

- [OneTrust](../consent-wrapper-onetrust) (beta)

## Settings / Options / Configuration

See the complete list of settings in the **[Settings interface](src/types/settings.ts)**

## Development

1. Build this package + all dependencies

```sh
yarn . build
```

2. Run tests

```
yarn test
```
