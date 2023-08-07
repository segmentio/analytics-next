import Head from 'next/head'
import Script from 'next/script'
import { analytics } from '@/utils/analytics'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

declare global {
  interface Window {
    OnetrustActiveGroups: string
    OneTrust: {
      OnConsentChanged: (callback: () => void) => void
      GetDomainData: () => {
        Groups: { CustomGroupId: string; GroupName: string }[]
      }
    }
  }
}

const getActiveGroups = (): string[] =>
  window.OnetrustActiveGroups.trim().split(',').filter(Boolean)

const useGroups = () => {
  const [groups, _setGroups] = React.useState({ enabled: {}, disabled: {} })

  const setGroups = () => {
    const data = window.OneTrust.GetDomainData().Groups.reduce(
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

  React.useEffect(() => {
    ;(window as any).OptanonWrapper = function () {
      setGroups()
      window.OneTrust.OnConsentChanged(() => setGroups())
    }
  }, [])
  return groups
}

export default function Home() {
  const {
    query: { writeKey },
  } = useRouter()

  const [ctx, setContext] = React.useState({} as any)
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
          <button
            onClick={() =>
              analytics.track('hello world').then((ctx) => {
                setContext(ctx)
              })
            }
          >
            Click to track event
          </button>
          <div>
            <h2>Enabled ✅</h2>
            <pre>{JSON.stringify(groups.enabled, undefined, 2)}</pre>

            <h2>Disabled / Not Configured ❌</h2>
            <pre>{JSON.stringify(groups.disabled, undefined, 2)}</pre>
          </div>
          {ctx.event?.context && (
            <>
              <h2>Track Context</h2>
              <pre>{JSON.stringify(ctx.event?.context, undefined, 2)}</pre>
            </>
          )}
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
