import { difference } from 'lodash'
import { browser } from '../lib/browser'
import { run } from '../lib/runner'
import { server } from '../lib/server'
import { samples } from '../__fixtures__/sources'

jest.setTimeout(100000)

let destinations = Object.keys(samples)
if (process.env.DESTINATION) {
  destinations = [process.env.DESTINATION]
}

describe('Destination Tests', () => {
  // needs to be written as a string so it's not transpiled
  const code = `(async () => {
    await new Promise(res => window.analytics.page({}, res))

    await new Promise(res => window.analytics.identify('Test', {
      email: 'test@mctesting.org',
    }, res))
    
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
      .map((n) => new URL(n.url).host)
      .sort()

    const nextReqs = results.next.networkRequests
      .map((n) => new URL(n.url).host)
      .sort()

    expect(nextReqs).not.toEqual([])
    expect(classicReqs).not.toEqual([])

    const missing = difference(classicReqs, nextReqs)

    expect(missing).toEqual([])
    expect(nextReqs).toEqual(expect.arrayContaining(classicReqs))
  })
})
