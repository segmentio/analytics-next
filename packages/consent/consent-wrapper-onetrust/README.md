This package is for the OneTrust integration for analytics consent


# Quick Start
### Snippet users:
1.) Delete `analytics.load(...)` from your snippet.

2.) Use the folliwing initialization code: 
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'


// snippet users
oneTrust(window.analytics)
window.analytics.load('<WRITE_KEY>')

```
### NPM Users
```ts
import { oneTrust } from '@segment/analytics-consent-wrapper-onetrust'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

oneTrust(analytics)

analytics.load({ writeKey: '<MY_WRITE_KEY'> })

```
