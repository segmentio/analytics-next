Why is this using wd.io instead of playwright?

- Webdriver.io is committed to the Webdriver Protocol, which is a community-driven spec (as opposed to Chrome Webdriver Protocol.). Playwright uses the Chrome Webdriver protocol for chrome and it's own [custom protocol](https://github.com/microsoft/playwright/issues/4862) for safari / edge.
- Webdriver.io protocol allows for much better device support-- such as ie11.
- Webdriver.io has native support for lighthouse and lots of other cool stuff!

## Project structure
- `/public` - Test server root
  - `/dist` - Holds the webpacked page-bundles that will be injected into each html page

- `/src` - Test suite files
  - `/page-bundles` - JS that will be injected into the test page (this will be built by webpack -> public/dist)
  - `/page-objects` - Page objects for the test suite
  - `/page-tests ` - Tests that will be run on the page
  

## Development
### 1. Build this package + deps
```sh
# include the "..."
yarn build... 
```
### 2. Start server + run tests (and exit gracefully)
```
yarn start-server-and-test
```
### 3. Make code changes.

### 4. Build + re-run tests with `yarn start-server-and-test`.

