import '../styles/globals.css'
import '../styles/dracula/dracula-ui.css'
import '../styles/dracula/prism.css'
import '../styles/logs-table.css'

import { AnalyticsProvider } from '../context/analytics'
import { useWriteKey, useCDNUrl } from '../utils/hooks/useConfig'

export default function ExampleApp({ Component, pageProps }) {
  const [writeKey] = useWriteKey()
  const [CDNUrl] = useCDNUrl()
  return (
    <AnalyticsProvider writeKey={writeKey} CDNUrl={CDNUrl}>
      <Component {...pageProps} />
    </AnalyticsProvider>
  )
}
