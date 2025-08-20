# @segment/analytics-next

Analytics Next (aka Analytics 2.0) is the latest version of Segment’s JavaScript SDK - enabling you to send your data to any tool without having to learn, test, or use a new API every time.

### Table of Contents

- [🏎️ Quickstart](#-quickstart)
  - [💡 Using with Segment](#-using-with-segment)
  - [💻 Using as an `npm` package](#-using-as-an-npm-package)
- [🔌 Architecture](#-architecture--plugins)
- [🐒 Development](#-development)

---

# 🏎️ Quickstart

The easiest and quickest way to get started with Analytics 2.0 is to [use it through Segment](#-using-with-segment). Alternatively, you can [install it through NPM](#-using-as-an-npm-package) and do the instrumentation yourself.

## 💡 Using with Segment

1. Create a javascript source at [Segment](https://app.segment.com) - new sources will automatically be using Analytics 2.0! Segment will automatically generate a snippet that you can add to your website. For more information visit our [documentation](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/)).

2. Start tracking!

## 💻 Using as an `npm` package

1. Install the package

```sh
# npm
npm install @segment/analytics-next

# yarn
yarn add @segment/analytics-next

# pnpm
pnpm add @segment/analytics-next
```

2. Import the package into your project and you're good to go (with working types)!

```ts
import { AnalyticsBrowser } from '@segment/analytics-next'

const analytics = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })

analytics.identify('hello world')

document.body?.addEventListener('click', () => {
  analytics.track('document body clicked!')
})
```

## Lazy / Delayed Loading
You can load a buffered version of analytics that requires `.load` to be explicitly called before initiating any network activity. This can be useful if you want to wait for a user to consent before fetching any tracking destinations or sending buffered events to segment.

- ⚠️ ️`.load` should only be called _once_.

```ts
export const analytics = new AnalyticsBrowser()

analytics.identify("hello world")

if (userConsentsToBeingTracked) {
    analytics.load({ writeKey: '<YOUR_WRITE_KEY>' }) // destinations loaded, enqueued events are flushed
}
```
This strategy also comes in handy if you have some settings that are fetched asynchronously.
```ts
const analytics = new AnalyticsBrowser()
fetchWriteKey().then(writeKey => analytics.load({ writeKey }))

analytics.identify("hello world")
```
## Error Handling
### Handling initialization errors
Initialization errors get logged by default, but if you also want to catch these errors, you can do the following:
```ts
export const analytics = new AnalyticsBrowser();
analytics
  .load({ writeKey: "MY_WRITE_KEY" })
  .catch((err) => ...);
```

## Custom CDN / API Proxy
[Self Hosting or Proxying Analytics.js documentation](
 https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/custom-proxy/#custom-cdn--api-proxy)

## Examples / Usage in Common Frameworks and SPAs

### Next.js
- https://github.com/vercel/next.js/tree/canary/examples/with-segment-analytics
- https://github.com/vercel/next.js/tree/canary/examples/with-segment-analytics-pages-router

### Vanilla React
```tsx
import { AnalyticsBrowser } from '@segment/analytics-next'

// We can export this instance to share with rest of our codebase.
export const analytics = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })

const App = () => (
  <div>
    <button onClick={() => analytics.track('hello world')}>Track</button>
  </div>
)
```



### Vue

1. Export analytics instance.

```ts
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = AnalyticsBrowser.load({
  writeKey: '<YOUR_WRITE_KEY>',
})
```

2. in `.vue` component

```tsx
<template>
  <button @click="track()">Track</button>
</template>

<script>
import { defineComponent } from 'vue'
import { analytics } from './services/segment'

export default defineComponent({
  setup() {
    function track() {
      analytics.track('Hello world')
    }

    return {
      track,
    }
  },
})
</script>
```

## Support for Web Workers (Experimental)
 While this package does not support web workers out of the box, there are options:

1. Run analytics.js in a web worker via [partytown.io](https://partytown.builder.io/). See [our partytown example](../../playgrounds/next-playground/pages/partytown). **Supports both cloud and device mode destinations, but not all device mode destinations may work.**

2. Try [@segment/analytics-node](../node) with `flushAt: 1`, which should work in any runtime where `fetch` is available. **Warning: cloud destinations only!**




## How to add typescript support (snippet users only)

1. Install npm package `@segment/analytics-next` as a dev dependency.

2. Create `./typings/analytics.d.ts`
```ts
// ./typings/analytics.d.ts
import type { AnalyticsSnippet } from "@segment/analytics-next";

declare global {
  interface Window {
    analytics: AnalyticsSnippet;
  }
}

```
3. Configure typescript to read from the custom `./typings` folder
```jsonc
// tsconfig.json
{
  ...
  "compilerOptions": {
    ....
    "typeRoots": [
      "./node_modules/@types",
      "./typings"
    ]
  }
  ....
}
```

##  🔌 Architecture & Plugins
- See [ARCHITECTURE.md](architecture/ARCHITECTURE.md)

## 🐒 Development

First, clone the repo and then startup our local dev environment:

```sh
$ git clone git@github.com:segmentio/analytics-next.git
$ cd analytics-next
$ nvm use  # installs correct version of node defined in .nvmrc.
$ yarn && yarn build
$ yarn test
$ yarn dev  # optional: runs analytics-next playground.
```

> If you get "Cannot find module '@segment/analytics-next' or its corresponding type declarations.ts(2307)" (in VSCode), you may have to "cmd+shift+p -> "TypeScript: Restart TS server"

Then, make your changes and test them out in the test app!

<img src="https://user-images.githubusercontent.com/2866515/135407053-7561d522-b969-484d-8d3a-6f1c4d9c025b.gif" alt="Example of the development app" width="500px">



