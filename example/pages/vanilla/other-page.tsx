import Link from 'next/link'
import React, { useEffect } from 'react'
import { useAnalytics } from '../../context/analytics'

const OtherPage: React.FC = () => {
  const analytics = useAnalytics()
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
          analytics
            .track('clicked other page!')
            .then((res) => console.log('tracked!', res))
        }}
        type="submit"
      />
      <Link href={'/vanilla'}>Vanilla Home Link</Link>
    </div>
  )
}

export default OtherPage
