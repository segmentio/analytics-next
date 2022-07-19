# Analytics React

Analytics React is the easiest way to integrate Segment Analytics in your React app - enabling you to send your data to any tool without having to learn, test, or use a new API every time.

### Table of Contents

- [🏎️ Quickstart](#-quickstart)
- [🔌 Plugins](#-plugins)
- [🐒 Development](#-development)
- [🧪 Testing](#-testing)
- [📜 License](#-license)

---

## 🏎️ Quickstart

Create a Javascript source at [Segment](https://app.segment.com) under **Connections** > **Sources** page. Once the source is added, locate its write key by navigating to **Settings** tab and choosing **API Keys**. Keep the write key handy, we'll be needing it later.

Install `@segment/analytics-react`, and its required dependency `@segment/analytics-next` into your project.

With the write key handy, and the `@segment/analytics-react` installed, setup the SDK in your app:

```tsx
import { createClient, AnalyticsProvider } from '@segment/analytics-react'
import App from './App'

const segmentClient = createClient({ writeKey: '<YOUR_WRITE_KEY>' })

const Root = () => (
  <AnalyticsProvider client={segmentClient}>
    <App />
  </AnalyticsProvder>
)
```

Now you can use the [Analytics API](https://segment.com/docs/connections/spec/) anywhere in your project, for example:

```tsx
import { useAnalytics } from '@segment/analytics-react'

export const Header = () => {
  const { track } = useAnalytics()

  const handleCartClick = () => {
    track('View Shopping Cart')
  }

  return (
    <HeaderContainer>
      <ShoppingCart onClick={handleCartClick} />
    </HeaderContainer>
  )
}
```

Since most React apps are SPAs, you'll need capture page views by wiring it up with your routing library. The example below demonstrates a quick way to log page views with `react-router`.

```tsx
import { useAnalytics } from '@segment/analytics-react'
import { useLocation } from 'react-router'

export const App = () => {
  const { page } = useAnalytics()
  const { pathname } = useLocation()

  useEffect(() => {
    // here the first parameter, category, has been left out for simplicity
    page(undefined, document.title, {
      path: pathname,
      url: pathname
    })
  }, [pathname])
}
```

> You can also just call the `page` API in each of your route Route directly.

And that's it!

Protip: Use the **Segment Inspector** Chrome extension to check your instrumentation and diagnose issues!

## 🔌 Plugins

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

## 🐒 Development

First, clone the repo and then startup our local dev environment:

```sh
$ git clone git@github.com:segmentio/analytics-next.git
$ cd analytics-next
$ yarn dev
```

> If you get "Cannot find module '@segment/analytics-next' or its corresponding type declarations.ts(2307)" (in VSCode), you may have to "cmd+shift+p -> "TypeScript: Restart TS server"

Then, make your changes and test them out in the test app!

<img src="https://user-images.githubusercontent.com/2866515/135407053-7561d522-b969-484d-8d3a-6f1c4d9c025b.gif" alt="Example of the development app" width="500px">

## 🧪 Testing
Feature work and bug fixes should include tests. Run all [Jest](https://jestjs.io) tests:
```
$ yarn test
```
Lint all with [ESLint](https://github.com/typescript-eslint/typescript-eslint/):
```
$ yarn lint
```

## 📜 License

MIT
