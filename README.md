# analytics-next

Client Side Instrumentation Platform.

## Get started

### Using with Segment

1. Create a javascript source at https://app.segment.com Segment automatically generates a JS snippet that you can add to your website. (for more information visit our [documentation](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/quickstart/)).

2. Start tracking!

### Using as an NPM package

1. Install the package

```
yarn add @segment/analytics-next
```

2. Import the package into your project and you're good to go (with working types)! Example react app:

```ts
import { Analytics, AnalyticsBrowser, Context } from '@segment/analytics-next'
import { useEffect, useState } from 'react'
import logo from './logo.svg'

function App() {
  const [analytics, setAnalytics] = useState<Analytics | undefined>(undefined)
  const [writeKey, setWriteKey] = useState('<YOUR_WRITE_KEY>')

  useEffect(() => {
    const loadAnalytics = async () => {
      let [response] = await AnalyticsBrowser.load({ writeKey })
      setAnalytics(response)
    }
    loadAnalytics()
  }, [writeKey])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          onClick={(e) => {
            e.preventDefault()
            analytics?.track('Hello world')
          }}
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Track
        </a>
      </header>
    </div>
  )
}

export default App
```

### Development

```sh
$ git clone git@github.com:segmentio/analytics-next.git
$ cd analytics-next
$ make dev
```

## Testing

The tests are written in [Jest](https://jestjs.io) and can be run be using `make test-unit`
Linting is done using [ESLint](https://github.com/typescript-eslint/typescript-eslint/) and can be run using `make lint`.

### Unit Testing

Please write small, and concise unit tests for every feature you work on.

```sh
$ make test-unit # runs all tests
$ yarn jest src/<path> # runs a specific test or tests in a folder
```
