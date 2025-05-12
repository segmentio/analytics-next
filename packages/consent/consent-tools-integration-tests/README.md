# @internal/consent-tools-integration-tests"

## Project structure
- `/public` - Test server root
  - `/dist` - Holds the webpacked page-bundles that will be injected into each html page

- `/src` - Test suite files
  - `/page-bundles` - For testing libraries that don't have a UMD bundle (i.e analytics-consent-tools)
  - `/page-objects` - Page objects for the test suite
  - `/page-tests ` - Tests that will be run on the page

## Development
### Build, start server, run tests (and exit gracefully)
```
yarn . test:int
```
