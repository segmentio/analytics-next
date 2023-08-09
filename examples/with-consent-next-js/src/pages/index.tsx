import Head from 'next/head'
import Script from 'next/script'
import {
  analytics,
  useAnalyticsPageEvent,
  useLoadAnalytics,
} from '@/utils/hooks/analytics'
import React, { ReactNode } from 'react'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

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

const ErrorMessage = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div>
    <h1>{title}</h1>
    <p>{description}</p>
  </div>
)

export default function Home({
  otKey,
  writeKey,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [ctx, setContext] = React.useState({} as any)
  const categories = useConsentCategories()
  const configErrors = []
  if (!otKey) {
    configErrors.push(
      <ErrorMessage
        title={`Missing OneTrust API Key (please pass as query param)`}
        description={`Example: ?otKey=80ca7b5c-e72f-4bd0-972a-b74d052a0820-test`}
      />
    )
  }
  if (!writeKey) {
    configErrors.push(
      <ErrorMessage
        title={`Missing Segment Write Key (please pass as query param)`}
        description={`Example: ?writeKey=80ca7b5c-e72f-4bd0-972a-b74d052a0820-test`}
      />
    )
  }
  if (configErrors.length) {
    return configErrors
  }

  useAnalyticsPageEvent()
  useLoadAnalytics(writeKey)
  return (
    <>
      <Head>
        <title>Home - OneTrust</title>
      </Head>
      <Script
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        type="text/javascript"
        data-domain-script={otKey}
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
        </div>
      </main>
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return {
    props: {
      writeKey: ctx.query.writeKey || null,
      otKey: ctx.query.otKey || null,
    },
  }
}
