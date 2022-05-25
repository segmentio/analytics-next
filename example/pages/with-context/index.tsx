import { useAnalytics } from '../../context/analytics'

export default () => {
  const analytics = useAnalytics()
  return (
    <button onClick={() => analytics.track('hello world').then(console.log)}>
      Track!
    </button>
  )
}
