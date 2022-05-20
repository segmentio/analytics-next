import Link from 'next/link'
import { AnalyticsBrowser } from '../../../'

export const analytics = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_WRITEKEY,
})

analytics.then(() => console.log('loaded!'))

const Vanilla: React.FC = () => {
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
