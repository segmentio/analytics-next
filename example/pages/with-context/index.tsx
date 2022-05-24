import { AnalyticsProvider, useAnalytics } from '../../context/analytics'
import { useWriteKey } from '../../utils/hooks/useWritekey'

const App = () => {
  const analytics = useAnalytics()
  return (
    <button onClick={() => analytics.track('hello world').then(console.log)}>
      Track!
    </button>
  )
}

export default () => {
  const [writeKey] = useWriteKey()
  return (
    <AnalyticsProvider writeKey={writeKey}>
      <App />
    </AnalyticsProvider>
  )
}
