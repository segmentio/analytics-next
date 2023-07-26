This package is for the OneTrust integration for analytics consent


# Quick Start


## Install dependency 

```sh
npm install @segment/analytics-consent-wrapper-onetrust

# or

yarn add @segment/analytics-consent-wrapper-onetrust
```

## For `npm` library users


- Use the following initialization code 
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

oneTrust(analytics)
analytics.load({ writeKey: '<MY_WRITE_KEY'> })

```

## For snippet users (window.analytics) who _also_ use a bundler like webpack
### *NOTE:* a pre-bundled version that can be loaded through a `<script>` is on the roadmap, but _not_ supported at this point

- Install the dependency (see directions)
- Delete the `analytics.load()` line from the snippet

```diff
- analytics.load("<MY_WRITE_KEY>");
```

- Use the following initialization code 

```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'

oneTrust(window.analytics)
window.analytics.load('<WRITE_KEY>')

```
