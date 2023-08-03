# Analytics.js with OneTrust Example (Next.js 13)

This is an example of using analytics.js with the OneTrust Consent Management Platform (CMP), using the library in this monorepo:
[@segment/analytics-consent-wrapper-onetrust](./packages/consent/consent-wrapper-onetrust)

# Quick Start
1. (_Optional_) To update OneTrust options (e.g. hardcode mappings):
`cp .env.local.EXAMPLE.js .env.local.js` + modify 

2. Start Server

```sh
yarn dev
```
3. Open http://localhost:3000?writeKey=MY_WRITEKEY
