# Consent Management for Analytics.js
## Packages
- [@segment/analytics-consent-tools](/consent-tools) - A library for integrating analytics with consent management platforms 
- [@segment/analytics-consent-wrapper-onetrust](/consent-wrapper-onetrust) - this is a library for using the OneTrust consent management platform with analytics.js

## Development

### Watch all consent packages _and_ their dependencies, building on change.
```sh
# from repo root
yarn turbo run watch --filter './packages/consent/*...'
```

### Run tests (does not require active watch, since it uses ts-jest under the hood which compiles TS in memory)
```sh
# from repo root
yarn turbo run test --filter './packages/consent/*'
```
