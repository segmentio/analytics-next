import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-json'
import JSONTree from 'react-json-tree'
import faker from 'faker'
import { shuffle } from 'lodash'

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

  const newEvent = () => {
    const fakerFns = [
      ...Object.entries(faker.name),
      ...Object.entries(faker.commerce),
      ...Object.entries(faker.internet),
      ...Object.entries(faker.company),
    ]

    const randomStuff = shuffle(fakerFns).slice(0, Math.round(Math.random() * 10) + 3)

    const event = randomStuff.reduce((ev, [name, fn]) => {
      return {
        [name]: fn(),
        ...ev,
      }
    }, {})

    return JSON.stringify(event, null, '  ')

    // return JSON.stringify(
    //   {
    //     name: faker.name.firstName(),
    //     lastName: faker.name.lastName(),
    //     email: faker.internet.email(),
    //     company: faker.company.companyName(),
    //     transaction: faker.helpers.createTransaction(),
    //     product: faker.commerce.product(),
    //   },
    //   null,
    //   '  '
    // )
  }

  const [event, setEvent] = React.useState(newEvent)

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
    <div className="drac-spacing-md-x">
      <Head>
        <title>Tester App</title>
      </Head>

      <h1>
        <span className="drac-text-purple-cyan">Analytics Next</span> Tester
      </h1>

      <main className="drac-box" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h2>Event</h2>
          <form>
            <div
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                marginTop: 20,
                marginBottom: 20,
              }}
              className="drac-box drac-border-purple"
            >
              <Editor
                value={event}
                onValueChange={(event) => setEvent(event)}
                highlight={(code) => highlight(code, languages.json)}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 12,
                }}
              />
            </div>
            <button
              className="drac-btn drac-bg-yellow-pink"
              style={{
                marginRight: 20,
              }}
              disabled={!analyticsReady}
              onClick={(e) => track(e)}
            >
              Track
            </button>
            <button
              style={{
                marginRight: 20,
              }}
              className="drac-btn drac-bg-purple-cyan"
              disabled={!analyticsReady}
              onClick={(e) => identify(e)}
            >
              Identify
            </button>

            <button
              className="drac-btn drac-bg-purple"
              onClick={(e) => {
                e.preventDefault()
                setEvent(newEvent())
              }}
            >
              Shuffle Event
            </button>
          </form>
        </div>

        <div className="drac-box drac-spacing-lg-x" style={{ flex: 1 }}>
          <h2>Result</h2>
          {ctx && (
            <JSONTree
              theme={{
                scheme: 'tomorrow',
                author: 'chris kempson (http://chriskempson.com)',
                base00: '#1d1f21',
                base01: '#282a2e',
                base02: '#373b41',
                base03: '#969896',
                base04: '#b4b7b4',
                base05: '#c5c8c6',
                base06: '#e0e0e0',
                base07: '#ffffff',
                base08: '#cc6666',
                base09: '#de935f',
                base0A: '#f0c674',
                base0B: '#b5bd68',
                base0C: '#8abeb7',
                base0D: '#81a2be',
                base0E: '#b294bb',
                base0F: '#a3685a',
              }}
              data={{
                event: ctx.event,
                logs: ctx.logger.logs,
                stats: ctx.stats.metrics,
              }}
              invertTheme={false}
            />
          )}
        </div>
      </main>
    </div>
  )
}
