# Analytics.js with OneTrust Example (Next.js 13)

This is an example of using analytics.js with the OneTrust Consent Management Platform (CMP), using the library in this monorepo:
[@segment/analytics-consent-wrapper-onetrust](/packages/consent/consent-wrapper-onetrust)

# Requirements
1. OneTrust Account
2. Segment Write key
3. OneTrust API key (data-domain-script value)
  ```html
  <script
    src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
    type="text/javascript"
    data-domain-script="XXX"  <--- THIS
  ></script>

```

# Quick Start
1. `nvm use && yarn install` (from root of monorepo)
2. Set up config:
  - `cp .env.local.EXAMPLE.js .env.local.js`
  - Fill in required values in `.env.local.js`
3. Run example with `yarn dev` 
