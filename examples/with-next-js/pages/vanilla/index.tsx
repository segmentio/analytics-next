import Link from 'next/link'
import React from 'react'
import { AnalyticsProvider, useAnalytics } from '../../context/analytics'

const Vanilla: React.FC = () => {
  const { analytics } = useAnalytics()

  return (
    <div>
      <input
        style={{
          display: 'block',
          margin: '1rem 0',
        }}
        value="submit"
        onClick={(e) => {
          e.preventDefault()
          analytics
            .track('vanilla click')
            .then((res) => console.log('tracked!', res))
            .catch(console.error)
        }}
        type="submit"
      />
      <Link href={'/vanilla/other-page'}>Go to Other Page</Link>
    </div>
  )
}

export default () => (
  <AnalyticsProvider>
    <Vanilla />
  </AnalyticsProvider>
)
