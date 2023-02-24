### Advanced QA

Analytics-Next contains a comprehensive QA test suite that verifies that E2E functionality is compatible with analytics.js classic.

1. Compile Analytics-Next (browser)

```sh
$ yarn build
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
