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

**There is a [React example repo](https://github.com/segmentio/react-example/tree/main/src/examples/analytics-package) which outlines using the Segment npm package.**

1. Install the package

```sh
# npm 
npm install @segment/analytics-next

# yarn
yarn add @segment/analytics-next

#pnpm
pnpm add @segment/analytics-next
```

2. Import the package into your project and you're good to go (with working types)! 
```
import { Analytics, AnalyticsBrowser, Context } from '@segment/analytics-next' 

async function loadAnalytics(): Promise<Analytics> { 
  const [ analytics, context ] = await AnalyticsBrowser.load({ writeKey }) 
  return analytics 
}
```

### using `React`
There is a [React example repo](https://github.com/segmentio/react-example/) which outlines using the [Segment snippet](https://github.com/segmentio/react-example/tree/main/src/examples/analytics-quick-start) and using the [Segment npm package](https://github.com/segmentio/react-example/tree/main/src/examples/analytics-package).

### using `Vite` with `Vue 3`

1. add to your `index.html` 

```html
<script>
  window.global = window
  var exports = {}
</script>
```

2. create composable file `segment.ts` with factory ref analytics:

```ts
import { ref, reactive } from 'vue'
import { Analytics, AnalyticsBrowser } from '@segment/analytics-next'

const analytics = ref<Analytics>()

export const useSegment = () => {
  if (!analytics.value) {
    AnalyticsBrowser.load({
      writeKey: '<YOUR_WRITE_KEY>',
    })
      .then(([response]) => {
        analytics.value = response
      })
      .catch((e) => {
        console.log('error loading segment')
      })
  }

  return reactive({
    analytics,
  })
}

```

3. in component 

```vue
<template>
  <button @click="track()">Track</button>
</template>

<script>
import { defineComponent } from 'vue'
import { useSegment } from './services/segment'

export default defineComponent({
  setup() {
    const { analytics } = useSegment()
    
    function track() { 
      analytics?.track('Hello world')
    }
    
    return {
      track
    }
  }
})
</script>

```


# 🐒 Development

First, clone the repo and then startup our local dev environment:

```sh
$ git clone git@github.com:segmentio/analytics-next.git
$ cd analytics-next
$ make dev
```

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

For further examples check out our [existing plugins](https://github.com/segmentio/analytics-next/tree/master/src/plugins).

# 🧪 Testing

The tests are written in [Jest](https://jestjs.io) and can be run be using `make test-unit`
Linting is done using [ESLint](https://github.com/typescript-eslint/typescript-eslint/) and can be run using `make lint`.

## ✅ Unit Testing

Please write small, and concise unit tests for every feature you work on.

```sh
$ make test-unit # runs all tests
$ yarn jest src/<path> # runs a specific test or tests in a folder
```
