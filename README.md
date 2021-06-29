# analytics-next

Client Side Instrumentation Platform.

## Get started

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

### Enabling AJSN

To enable analytics-next for a source you must first add your workspace to flagon. To do this, run the following command in slack

```sh
$ /flagon-{stage/prod} -f app-ui-analytics-js -n analytics-next {workspaceID}
```

or manually add your workspace ID to the overrides list in the flagon UI (ie. https://flagon.segment.com/families/app-ui-analytics-js/flags/analytics-next).
Once this is done you can navigate to the Settings > Analytics.js tab of your javascript source and toggle analytics-next. Once ajs-renderer has rebuilt your project (<5 minutes), you're all set!

## Testing

The tests are written in [Jest](https://jestjs.io) and can be run be using `make test-unit`
Linting is done using [ESLint](https://github.com/typescript-eslint/typescript-eslint/) and can be run using `make lint`.

### Unit Testing

Please write small, and concise unit tests for every feature you work on.

```sh
$ make test-unit # runs all tests
$ yarn jest src/<path> # runs a specific test or tests in a folder
```

### Advanced QA (internal use only)

Analytics-Next contains a comprehensive QA test suite that verifies that E2E functionality is compatible with analytics.js classic.

1. Compile Analytics-Next

```sh
$ make build # any time you make changes to Analytics-Next
## or
$ yarn umd --watch ## (in a separate tab) if you'd like
```

2. Grab list of test sources

```sh
export QA_SAMPLES=$(aws-okta exec dev-write -- chamber read analytics-next QA_SAMPLES -q)
export QA_SOURCES=$(aws-okta exec dev-write -- chamber read analytics-next QA_SOURCES -q)
```

3. Run QA tests:

```sh
$ make test-qa ## if you'd like to run all tests in one go (generally slower)
```

or run individual tests (much faster)

```sh
$ yarn jest --runTestsByPath qa/__tests__/<test_path>
```

2.1. QAing Analytics-Next against all destinations

```sh
make test-qa-destinations
```

2.1.1 Debugging one specific destination

```sh
# Will open one Chrome instance for AJS Classic and one for AJS Next
$ DESTINATION=amplitude DEBUG=true make test-qa-destinations
```

## Releasing

### Feature branches

Feature branches are automatically released under:

- `http://cdn.segment.com/analytics-next/br/<branch>/<latest|sha>/standalone.js.gz`

### Production

Once you have tested your changes and they have been approved for a new release, merge your pull request and follow the steps:

- `make release`
  > creates a release tag that is then compiled and published in CI
