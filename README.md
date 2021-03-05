# analytics-next

Client Side Instrumentation Platform.

## Get started

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

### Advanced QA

Analytics-Next contains a compreehensive QA test suite that verifies that E2E functionality is compatible with analytics.js classic.

1. Compile Analytics-Next

```sh
$ make build # any time you make changes to Analytics-Next
## or
$ yarn umd --watch ## (in a separate tab) if you'd like
```

2. Run QA tests:

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
$ make test-qa-destinations DESTINATION=amplitude DEBUG=true
```

## Releasing

Once you have tested your changes and they have been approved for a new release, merge your pull request and follow the steps:

- `make release-prod` - this will compile the code, create a new version and publish the changes to s3
- `make rebuild-sources-prod` - rebuild all sources that use AJS Next
