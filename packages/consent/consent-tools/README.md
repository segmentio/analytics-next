# @segment/analytics-consent-tools
## Example
## Wrapper Usage 
Please see our [ onetrust example.](../consent-wrapper-onetrust)
```ts
// wrapper.js
import { createWrapper } from '@segment/analytics-consent-tools'

export const withCMP = createWrapper({
  shouldLoad: () => Promise.resolve({ Advertising: false, Functional: true }),
  getCategories: () => ({ Advertising: false, Functional: true }),
})
```

## Wrapper Consumer Usage
## `npm`
```js
import { withCMP } from './wrapper'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

withCmp(analytics)

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

withCmp(window.analytics)

window.analytics.load('<MY_WRITE_KEY')
```


## Settings / Options / Configuration
Please check the [CreateWrapperSettings interface](src/types/settings.ts) 


## Development
1. Build this package + all dependencies
```sh
# include the "..."
yarn build... 
```

2. Run tests
```
yarn test
```
