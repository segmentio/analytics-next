Why is this using wd.io instead of playwright?

- Webdriver.io is committed to the Webdriver Protocol, which is a community-driven spec (as opposed to Chrome Webdriver Protocol.). Playwright uses the Chrome Webdriver protocol for chrome and it's own [custom protocol](https://github.com/microsoft/playwright/issues/4862) for safari / edge.
- Webdriver.io protocol allows for much better device support-- such as ie11.
- Webdriver.io has native support for lighthouse and lots of other cool stuff!

## Development
### 1. Build this package + dependencies

```sh
# include the "..."
yarn build... 
```
### 2. Start server  on `https://localhost:9000` and auto-build `public/dist` (Server that the tests use to run)
[label](https://localhost:9000/index.html)
```sh
yarn dev
```

Test pages to inspect:
- https://localhost:9000/index.html
- https://localhost:9000/onetrust.html


### 3.) Run integration tests
```sh
yarn test
```


## Project structure

- `src` - Test files and fixtures
- `public` - Where asssets related to tests are kept
- `public/dist` - Where build artifacts are kept that get loaded into the test page.
