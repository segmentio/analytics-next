import Link from 'next/link'
import React from 'react'
import { useAnalytics } from '../../context/analytics'

const Vanilla: React.FC = () => {
  const analytics = useAnalytics()
  analytics.identify('hello').then((res) => console.log('identified!', res))
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
        }}
        type="submit"
      />
      <Link href={'/vanilla/other-page'}>Go to Other Page</Link>
    </div>
  )
}

export default Vanilla
