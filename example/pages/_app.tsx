import '../styles/globals.css'
import '../styles/dracula/dracula-ui.css'
import '../styles/dracula/prism.css'
import '../styles/logs-table.css'

import { AnalyticsProvider } from '../context/analytics'

export default function ExampleApp({ Component, pageProps }) {
  return (
    <AnalyticsProvider>
      <Component {...pageProps} />
    </AnalyticsProvider>
  )
}
