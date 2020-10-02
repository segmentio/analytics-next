import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import JSONTree from 'react-json-tree'

import { AnalyticsSettings, Analytics } from '../../dist/commonjs'
import { Context } from '../../dist/commonjs/core/context'

const settings: AnalyticsSettings = {
  // segment.com
  // writeKey: '***REMOVED***',

  // segment app
  writeKey: '***REMOVED***',
  integrations: {
    Intercom: false,
    Zapier: false,
    Repeater: false,
    'Amazon Kinesis': false,
    Slack: false,
    'Amazon S3': false,
    Indicative: false,
    Sherlock: false,
    Vitally: false,
    Webhooks: false,
  },
}

export default function Home(): React.ReactElement {
  const [analytics, setAnalytics] = useState<Analytics | undefined>(undefined)
  const [analyticsReady, setAnalyticsReady] = useState<boolean>(false)
  const [event, setEvent] = React.useState(`{
  "banana": "phone"
}`)

  const [ctx, setCtx] = React.useState<Context>()

  useEffect(() => {
    async function fetchAnalytics() {
      const response = await Analytics.load(settings)
      if (response) {
        setAnalytics(response)
        setAnalyticsReady(true)
        // @ts-ignore
        window.analytics = response
      }
    }
    if (!analyticsReady && !analytics) {
      fetchAnalytics()
    }
  }, [analytics, analyticsReady])

  const track = async (e) => {
    e.preventDefault()

    if (!analyticsReady) {
      console.log('not ready yet')
    }

    const ctx = await analytics.track('Track Event', JSON.parse(event))
    setCtx(ctx)

    ctx.flush()
  }

  const identify = async (e) => {
    e.preventDefault()

    if (!analyticsReady) {
      console.log('not ready yet')
    }

    const ctx = await analytics.identify('Test User', JSON.parse(event))

    setCtx(ctx)

    ctx.flush()
  }

  return (
    <div>
      <Head>
        <title>Tester App</title>
      </Head>

      <main>
        <h2>Event</h2>
        <form>
          <Editor
            value={event}
            onValueChange={(event) => setEvent(event)}
            highlight={(code) => highlight(code, languages.js)}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 12,
            }}
          />
          <button disabled={!analyticsReady} onClick={(e) => track(e)}>
            Track
          </button>
          <button disabled={!analyticsReady} onClick={(e) => identify(e)}>
            Identify
          </button>
        </form>

        <h2>Result</h2>
        {ctx && (
          <JSONTree
            data={{
              event: ctx.event,
              logs: ctx.logger.logs,
              stats: ctx.stats.metrics,
            }}
          />
        )}
      </main>
    </div>
  )
}
