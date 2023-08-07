import Head from 'next/head'
import Script from 'next/script'
import { analytics } from '@/utils/analytics'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { use, useEffect } from 'react'

const getActiveGroups = (): string[] =>
  // @ts-ignore
  window.OnetrustActiveGroups.trim().split(',').filter(Boolean)

const useGroups = () => {
  const [groups, _setGroups] = React.useState({})

  const setGroups = () => {
    // @ts-ignore
    const data =
      // @ts-ignore
      window.OneTrust.GetDomainData()
        // @ts-ignore
        .Groups.reduce(
          // @ts-ignore
          (acc, el) => {
            if (getActiveGroups().includes(el.CustomGroupId)) {
              acc.enabled = {
                ...acc.enabled,
                [el.CustomGroupId]: el.GroupName,
              }
            } else {
              acc.disabled = {
                ...acc.disabled,
                [el.CustomGroupId]: el.GroupName,
              }
            }
            return acc
          },
          { enabled: {}, disabled: {} }
        )

    _setGroups(data)
  }

  useEffect(() => {
    ;(window as any).OptanonWrapper = function () {
      setGroups()
      // @ts-ignore
      window.OneTrust.OnConsentChanged(() => setGroups())
    }
  }, [])
  return groups
}

export default function Home() {
  const {
    query: { writeKey },
  } = useRouter()

  const groups = useGroups()

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
          <div>
            <pre>{JSON.stringify(groups, undefined, 2)}</pre>
          </div>

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
