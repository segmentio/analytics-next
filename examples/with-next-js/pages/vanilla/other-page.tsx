import Link from 'next/link'
import React from 'react'
import { AnalyticsProvider, useAnalytics } from '../../context/analytics'

const OtherPage: React.FC = () => {
  const { analytics } = useAnalytics()
  return (
    <div>
      <input
        style={{
          display: 'block',
          margin: '1rem 0',
        }}
        value="Track!"
        onClick={(e) => {
          e.preventDefault()
          void analytics
            .track('clicked other page!')
            .then((res) => console.log('tracked!', res))
            .catch(console.error)
        }}
        type="submit"
      />
      <Link href={'/vanilla'}>Go Back</Link>
    </div>
  )
}

export default () => (
  <AnalyticsProvider>
    <OtherPage />
  </AnalyticsProvider>
)
