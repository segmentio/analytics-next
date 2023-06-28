Why is this using wd.io instead of playwright?

- Webdriver.io is committed to the Webdriver Protocol, which is a community-driven spec (as opposed to Chrome Webdriver Protocol.). Playwright uses the Chrome Webdriver protocol for chrome and it's own [custom protocol](https://github.com/microsoft/playwright/issues/4862) for safari / edge.
- Webdriver.io protocol allows for much better device support-- such as ie11.
- Webdriver.io has native support for lighthouse and lots of other cool stuff!

## Project structure

- `src` - Test files and fixtures
- `public` - Where asssets related to tests are kept
- `public/dist` - Where build artifacts are kept that get loaded into the test page.

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

