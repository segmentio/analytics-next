# Analytics Next

Analytics Next (aka Analytics 2.0) is the latest version of Segment’s JavaScript SDK - enabling you to send your data to any tool without having to learn, test, or use a new API every time.

### Table of Contents

- [🏎️ Quickstart](#-quickstart)
  - [💡 Using with Segment](#-using-with-segment)
  - [💻 Using as an NPM package](#-using-as-an-npm-package)
- [🔌 Plugins](#-plugins)
- [🐒 Development](#-development)
- [🧪 Testing](#-testing)
  - [✅ Unit Testing](#-unit-testing)

---

# 🏎️ Quickstart

The easiest and quickest way to get started with Analytics 2.0 is to [use it through Segment](#-using-with-segment). Alternatively, you can [install it through NPM](#-using-as-an-npm-package) and do the instrumentation yourself.

## 💡 Using with Segment

1. Create a javascript source at [Segment](https://app.segment.com) - new sources will automatically be using Analytics 2.0! Segment will automatically generate a snippet that you can add to your website. For more information visit our [documentation](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/)).

2. Start tracking!

## 💻 Using as an NPM package

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

## Usage in Common Frameworks
### using `React` (Simple)

```tsx
import { AnalyticsBrowser } from '@segment/analytics-next'

// we can export this instance to share with rest of our codebase.
export const analytics = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })

const App = () => (
  <div>
    <button onClick={() => analytics.track('hello world')}>Track</button>
  </div>
)
```

### using `React` (Advanced w/ React Context)

```tsx
import { AnalyticsBrowser } from '@segment/analytics-next'

const AnalyticsContext = React.createContext<AnalyticsBrowser>(undefined!);

type Props = {
  writeKey: string;
  children: React.ReactNode;
};
export const AnalyticsProvider = ({ children, writeKey }: Props) => {
  const analytics = React.useMemo(
    () => AnalyticsBrowser.load({ writeKey }),
    [writeKey]
  );
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Create an analytics hook that we can use with other components.
export const useAnalytics = () => {
  const result = React.useContext(AnalyticsContext);
  if (!result) {
    throw new Error("Context used outside of its Provider!");
  }
  return result;
};

// use the context we just created...
const TrackButton = () => {
  const analytics = useAnalytics()
  return (
    <button onClick={() => analytics.track('hello world')}>
      Track!
    </button>
  )
}

const App = () => {
  return (
    <AnalyticsProvider writeKey='<YOUR_WRITE_KEY>'>
      <TrackButton />
    </AnalyticsProvider>
  )
```

More React Examples:

- Our [playground](/examples/with-next-js/) (written in NextJS) -- this can be run with `yarn dev`.
- Complex [React example repo](https://github.com/segmentio/react-example/) which outlines using the [Segment snippet](https://github.com/segmentio/react-example/tree/main/src/examples/analytics-quick-start) and using the [Segment npm package](https://github.com/segmentio/react-example/tree/main/src/examples/analytics-package).

### using `Vue 3`

1. create composable file `segment.ts` with factory ref analytics:

```ts
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = AnalyticsBrowser.load({
  writeKey: '<YOUR_WRITE_KEY>',
})
```

2. in component

```vue
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

1. Run analytics.js in a web worker via [partytown.io](https://partytown.builder.io/). See [our partytown example](../../examples/with-next-js/pages/partytown). **Supports both cloud and device mode destinations, but not all device mode destinations may work.**

2. Try [@segment/analytics-node](../node) with `maxEventsInBatch: 1`, which should work in any runtime where `fetch` is available. **Warning: cloud destinations only!**




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

# 🔌 Plugins

When developing against Analytics Next you will likely be writing plugins, which can augment functionality and enrich data. Plugins are isolated chunks which you can build, test, version, and deploy independently of the rest of the codebase. Plugins are bounded by Analytics Next which handles things such as observability, retries, and error management.

Plugins can be of two different priorities:

1. **Critical**: Analytics Next should expect this plugin to be loaded before starting event delivery
2. **Non-critical**: Analytics Next can start event delivery before this plugin has finished loading

and can be of five different types:

1. **Before**: Plugins that need to be run before any other plugins are run. An example of this would be validating events before passing them along to other plugins.
2. **After**: Plugins that need to run after all other plugins have run. An example of this is the segment.io integration, which will wait for destinations to succeed or fail so that it can send its observability metrics.
3. **Destination**: Destinations to send the event to (ie. legacy destinations). Does not modify the event and failure does not halt execution.
4. **Enrichment**: Modifies an event, failure here could halt the event pipeline.
5. **Utility**: Plugins that change Analytics Next functionality and don't fall into the other categories.

Here is an example of a simple plugin that would convert all track events event names to lowercase before the event gets sent through the rest of the pipeline:

```ts
export const lowercase: Plugin = {
  name: 'Lowercase events',
  type: 'before',
  version: '1.0.0',

  isLoaded: () => true,
  load: () => Promise.resolve(),

  track: (ctx) => {
    ctx.event.event = ctx.event.event.toLowerCase()
    return ctx
  },
  identify: (ctx) => ctx,
  page: (ctx) => ctx,
  alias: (ctx) => ctx,
  group: (ctx) => ctx,
  screen: (ctx) => ctx,
}
```

For further examples check out our [existing plugins](/packages/browser/src/plugins).

## 🧪 QA
Feature work and bug fixes should include tests. Run all [Jest](https://jestjs.io) tests:
```
$ yarn test
```
Lint all with [ESLint](https://github.com/typescript-eslint/typescript-eslint/):
```
$ yarn lint
```



