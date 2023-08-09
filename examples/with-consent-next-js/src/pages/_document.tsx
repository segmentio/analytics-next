/* eslint-disable @next/next/no-sync-scripts */
import { Html, Head, Main, NextScript } from 'next/document'
import { useAnalyticsPageEvent } from '../utils/hooks/analytics'
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
          data-domain-script="80ca7b5c-e72f-4bd0-972a-b74d052a0820-test"
        ></script>
      </body>
    </Html>
  )
}
