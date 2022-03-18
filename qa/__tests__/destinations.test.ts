import { difference } from 'lodash'
import { reportMetrics } from '../lib/benchmark'
import { browser } from '../lib/browser'
import { run } from '../lib/runner'
import { server } from '../lib/server'

jest.setTimeout(100000)

const samples = JSON.parse(process.env.QA_SAMPLES)

let destinations = Object.keys(samples)
if (process.env.DESTINATION) {
  destinations = [process.env.DESTINATION]
}

jest.retryTimes(10)
describe('Destination Tests', () => {
  // needs to be written as a string so it's not transpiled

  // We use a 150ms fake interval between each to ensure that we don't any destination buffering
  // e.g. Clicky, Google Analytics, and others will treat our events as bots (or will buffer them)
  // if we deliver events too quickly.

  const code = `(async () => {
    await new Promise(res => window.analytics.page({}, res))

    // second page so that assumePageView destinations stop complaining
    await new Promise(res => setTimeout(res, Math.random() * 150 + 100))
    await new Promise(res => window.analytics.page({}, res))

    await new Promise(res => setTimeout(res, Math.random() * 150 + 100))
    await new Promise(res => window.analytics.identify('Test', {
      email: 'test@mctesting.org',
    }, res))

    await new Promise(res => setTimeout(res, Math.random() * 150 + 100))
    await new Promise(res => window.analytics.track('Track!', {
      leProp: 'propé',
    }, res))
  })()`

  test.concurrent.each(destinations)(`%p`, async (destination) => {
    const key = destination as keyof typeof samples
    const writeKey = samples[key][0]

    const [url, chrome] = await Promise.all([server(), browser()])
    const results = await run({
      browser: chrome,
      script: code,
      serverURL: url,
      writeKey,
    })

    const classicReqs = results.classic.networkRequests
      .map((n) => {
        const url = new URL(n.url)

        return JSON.stringify({
          host: url.host + url.pathname,
          queryParams: Array.from(url.searchParams.entries())
            .map((entry) => entry[0])
            .filter((p) => !p.match(/^\d+$/))
            .sort(),
        })
      })
      .sort()

    const nextReqs = results.next.networkRequests
      .map((n) => {
        const url = new URL(n.url)
        return JSON.stringify({
          host: url.host + url.pathname,
          queryParams: Array.from(url.searchParams.entries())
            .map((entry) => entry[0])
            .filter((p) => !p.match(/^\d+$/))
            .sort(),
        })
      })
      .sort()

    const nextMetrics = results.next.metrics
    const classicMetrics = results.classic.metrics

    if (process.env.STATS_WRITEKEY) {
      await reportMetrics(nextMetrics, classicMetrics)
    }

    expect(nextReqs).not.toEqual([])
    expect(classicReqs).not.toEqual([])

    const missing = difference(classicReqs, nextReqs)

    expect(missing).toEqual([])
    expect(nextReqs).toEqual(expect.arrayContaining(classicReqs))
  })
})
