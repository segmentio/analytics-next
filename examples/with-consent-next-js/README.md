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
1. Follow instructions in `DEVELOPMENT.md`.
2. Run this example
```
yarn dev
```
3. Open the following URL, replacing the "XXX" with your write key and OneTrust API key
```
 http://localhost:3000?writekey=XXX&onetrust_api_key=XXX
``````
