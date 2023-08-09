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
    OptanonWrapper: () => void
  }
}

const getActiveConsentCategories = (): string[] =>
  window.OnetrustActiveGroups.trim().split(',').filter(Boolean)

/**
 * This hook will return the consent groups that are enabled and disabled.
 */
const useConsentCategories = () => {
  const [groups, _setCategories] = React.useState({ enabled: {}, disabled: {} })

  const setCategories = () => {
    const data = window.OneTrust.GetDomainData().Groups.reduce(
      (acc, el) => {
        if (getActiveConsentCategories().includes(el.CustomGroupId)) {
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

    _setCategories(data)
  }

  React.useEffect(() => {
    window.OptanonWrapper = function () {
      setCategories()
      window.OneTrust.OnConsentChanged(() => setCategories())
    }
  }, [])
  return groups
}

export default function Home() {
  const {
    query: { writeKey },
  } = useRouter()

  const [ctx, setContext] = React.useState({} as any)
  const categories = useConsentCategories()
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

          <div>
            <h2>Consent Categories</h2>
            <h3>Enabled ✅</h3>
            <pre>{JSON.stringify(categories.enabled, undefined, 2)}</pre>

            <h3>Disabled / Not Configured ❌</h3>
            <pre>{JSON.stringify(categories.disabled, undefined, 2)}</pre>
          </div>
          <br />
          <br />
          <button
            onClick={() =>
              analytics.track('hello world').then((ctx) => {
                setContext(ctx)
              })
            }
          >
            Send track event
          </button>
          {ctx.event?.context && (
            <>
              <h2>Track Context Payload</h2>
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
