This package is for the OneTrust integration for analytics consent


# Quick Start

## For snippet users (window.analytics)
1. Delete the `analytics.load()` line from the snippet

```diff
- analytics.load("<MY_WRITE_KEY>");
```

2. Use the folliwing initialization code: 
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'


// snippet users
oneTrust(window.analytics)
window.analytics.load('<WRITE_KEY>')

```
## For `npm` library users
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

oneTrust(analytics)

analytics.load({ writeKey: '<MY_WRITE_KEY'> })

```
