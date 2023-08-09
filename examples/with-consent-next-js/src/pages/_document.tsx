/* eslint-disable @next/next/no-sync-scripts */
import { Html, Head, Main, NextScript } from 'next/document'
import { useAnalyticsPageEvent } from '../utils/hooks/analytics'
import { getConfig } from '../utils/config'
export default function Document() {
  useAnalyticsPageEvent()
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        <script
          src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
          type="text/javascript"
          data-domain-script={getConfig().oneTrustApiKey}
        ></script>
      </body>
    </Html>
  )
}
