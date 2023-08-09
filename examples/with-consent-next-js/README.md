# Analytics.js with OneTrust Example (Next.js 13)

This is an example of using analytics.js with the OneTrust Consent Management Platform (CMP), using the library in this monorepo:
[@segment/analytics-consent-wrapper-onetrust](/packages/consent/consent-wrapper-onetrust)

# Requirements
1. Your Segment write key
2. Your OneTrust API key (`data-domain-script` value below)
  ```html
  <script
    src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
    type="text/javascript"
    data-domain-script="XXX"  <--- THIS
  ></script>

```

# Quick Start
1. `nvm use && yarn install` (from root of monorepo)
2. Run example with `yarn dev` 
3. Open `http://localhost:3000/?writeKey=<YOUR_WRITEKEY>&otKey=<YOUR_ONETRUST_KEY>` (see [requirements](#requirements) above)
