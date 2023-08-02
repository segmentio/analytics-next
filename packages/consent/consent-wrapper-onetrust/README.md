This package is for the OneTrust integration for analytics consent


# Quick Start

## Configure OneTrust + Segment
### Ensure your OneTrust SDK is loaded before this library
```html
<head>
<!-- This should be included before the Segment snippet -->
  <script src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js" type="text/javascript" charset="UTF-8"
    data-domain-script="0000-0000-000-test"></script>
```

### Ensure that consent is enabled and that you have created your Integration -> Consent Category Mappings
- Ensure that your integrations in the Segment UI have consent enabled, and that they map to the category IDs (sometimes called Cookie Group IDs).

-  This library expects the [OneTrust Banner SDK](https://community.cookiepro.com/s/article/UUID-d8291f61-aa31-813a-ef16-3f6dec73d643?language=en_US) to be available in order interact with OneTrust. This library derives the group IDs that are active for the current user from the `window.OneTrustActiveGroups` object provided by the OneTrust SDK. Read this article following [article for more information [community.cookiepro.com]](https://community.cookiepro.com/s/article/UUID-66bcaaf1-c7ca-5f32-6760-c75a1337c226?language=en_US).

 For example, "CAT0001", "CAT0002", etc.) that you have configured in OneTrust
![onetrust category ids](img/onetrust-cat-id.jpg)


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

### _NOTE:_ a pre-bundled version that can be loaded through a `<script>` is on the roadmap, but _not_ supported at this point

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


