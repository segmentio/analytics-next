import Head from 'next/head'
import Script from 'next/script'
import { analytics } from '@/utils/analytics'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Home() {
  const {
    query: { writeKey },
  } = useRouter()

  return (
    <>
      <Head>
        <title>Home - OneTrust</title>
      </Head>
      {/* OneTrust Script */}
      <Script
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        type="text/javascript"
        data-domain-script="80ca7b5c-e72f-4bd0-972a-b74d052a0820-test"
      />
      <main>
        <div>
          <h1>Consent w/ Segment Analytics</h1>
          <button onClick={() => analytics.track('hello world')}>
            Click to track event
          </button>

          <p>
            For debugging. Please check console (window.analytics should be
            available)
          </p>
          <p>
            You must configure your segment consent settings for this to work.
          </p>
          <p>
            <Link href={`/other-page?writeKey=${writeKey}`}>Other Page</Link>
          </p>
        </div>
      </main>
    </>
  )
}
