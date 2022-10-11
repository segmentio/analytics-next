import React, { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-json'
import JSONTree from 'react-json-tree'
import faker from 'faker'
import { shuffle } from 'lodash'
import Table from 'rc-table'
import { useAnalytics } from '../context/analytics'
import { Analytics, Context, AnalyticsBrowser } from '@segment/analytics-next'

const jsontheme = {
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
  base09: '#9580FF',
  base0A: '#f0c674',
  base0B: '#8AFF80',
  base0C: '#8abeb7',
  base0D: '#FF80BF',
  base0E: '#b294bb',
  base0F: '#a3685a',
}

export default function Home(): React.ReactElement {
  const [analytics, setAnalytics] = useState<Analytics | undefined>(undefined)

  const writeKeyRef = useRef<HTMLInputElement>()
  const cdnURLRef = useRef<HTMLInputElement>()

  const {
    analytics: analyticsBrowser,
    cdnURL,
    setCDNUrl,
    writeKey,
    setWriteKey,
  } = useAnalytics()

  const mockTraits = (): string => {
    const fakerFns = [
      ...Object.entries(faker.name),
      ...Object.entries(faker.commerce),
      ...Object.entries(faker.internet),
      ...Object.entries(faker.company),
    ]

    const randomStuff = shuffle(fakerFns).slice(
      0,
      Math.round(Math.random() * 10) + 3
    )

    const event = randomStuff.reduce((ev, [name, fn]) => {
      return {
        [name]: fn(),
        ...ev,
      }
    }, {})

    return JSON.stringify(event, undefined, 2)
  }

  const [event, setEvent] = React.useState('')
  const [ctx, setCtx] = React.useState<Context>()
  const [options, setOptions] = React.useState(
    JSON.stringify({ integrations: { All: true } }, undefined, 2)
  )

  useEffect(() => {
    async function handleAnalyticsLoading(browser: AnalyticsBrowser) {
      try {
        const [response, ctx] = await browser
        setCtx(ctx)
        setAnalytics(response)
        setEvent(mockTraits())
        // @ts-ignore
        window.analytics = response
      } catch (err) {
        console.error(err)
        setCtx(undefined)
        setAnalytics(undefined)
        setEvent('{}')
        setOptions('{}')
      }
    }
    handleAnalyticsLoading(analyticsBrowser).catch(console.error)
  }, [analyticsBrowser])

  return (
    <div className="drac-spacing-md-x">
      <Head>
        <title>Tester App</title>
      </Head>

      <h1 className="drac-text">
        <span className="drac-text-purple-cyan">Analytics Next</span> Tester
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setWriteKey(writeKeyRef!.current!.value)
          setCDNUrl(cdnURLRef!.current!.value)
        }}
      >
        <label>
          CDN:
          <input type="text" ref={cdnURLRef} defaultValue={cdnURL} />
        </label>
        <br />
        <label>
          Writekey:
          <input type="text" ref={writeKeyRef} defaultValue={writeKey} />
        </label>
        <input type="submit" value="Load Analytics" />
      </form>

      <main
        className="drac-box"
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 className="drac-text">Event</h2>
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
              <Editor
                value={options}
                onValueChange={(opts) => setOptions(opts)}
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
              onClick={(e) => {
                e.preventDefault()
                const parsedEvent = JSON.parse(event)
                analytics
                  .track(
                    parsedEvent?.event ?? 'Track Event',
                    parsedEvent,
                    JSON.parse(options)
                  )
                  .then(setCtx)
                  .catch(console.error)
              }}
            >
              Track
            </button>
            <button
              style={{
                marginRight: 20,
              }}
              className="drac-btn drac-bg-purple-cyan"
              onClick={(e) => {
                e.preventDefault()
                const { userId = 'Test User', ...traits } = JSON.parse(event)
                void analytics
                  .identify(userId, traits, JSON.parse(options))
                  .then(setCtx)
                  .catch(console.error)
              }}
            >
              Identify
            </button>

            <button
              id="shuffle"
              className="drac-btn drac-bg-purple"
              onClick={(e) => {
                e.preventDefault()
                setEvent(mockTraits())
              }}
            >
              Shuffle Event
            </button>
          </form>
        </div>

        <div className="drac-box drac-spacing-lg-x" style={{ flex: 1 }}>
          <h2 className="drac-text">Result</h2>
          {ctx && (
            <JSONTree
              theme={jsontheme}
              sortObjectKeys
              data={ctx.event}
              invertTheme={false}
            />
          )}
        </div>
      </main>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div className="drac-box drac-spacing-md-y" style={{ flex: 1 }}>
          <h2 className="drac-text">Logs</h2>
          <Table
            columns={[
              {
                title: 'Level',
                dataIndex: 'level',
                key: 'level',
              },
              {
                title: 'Message',
                dataIndex: 'message',
                key: 'message',
              },
              {
                title: 'Extras',
                dataIndex: 'extras',
                key: 'extras',
                width: '100%',
                render(_val, logMessage) {
                  const json = logMessage.extras ?? {}
                  return (
                    <JSONTree
                      shouldExpandNode={(_keyName, _data, level) => level > 0}
                      theme={jsontheme}
                      data={json}
                      invertTheme={false}
                    />
                  )
                },
              },
            ]}
            data={ctx?.logs() ?? []}
          />
        </div>

        <div className="drac-box drac-spacing-md-y" style={{ flex: 1 }}>
          <h2 className="drac-text">Stats</h2>
          <Table
            columns={[
              {
                title: 'Metric',
                dataIndex: 'metric',
                key: 'metric',
              },
              {
                title: 'Value',
                dataIndex: 'value',
                key: 'value',
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: 'Tags',
                dataIndex: 'tags',
                key: 'tags',
                width: '100%',
                render(_val, metric) {
                  return JSON.stringify(metric.tags)
                },
              },
            ]}
            data={ctx?.stats.metrics ?? []}
          />
        </div>
      </div>
    </div>
  )
}
