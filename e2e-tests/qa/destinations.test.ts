import { difference } from 'lodash'
import { run } from './runner'
import { startLocalServer } from './server'
import { samples } from './__fixtures__/sources'

// tv-squared
// _initialize chartbeat

const destinations = Object.keys(samples)

jest.setTimeout(100000)

let url: string
const server = async () => {
  if (url) {
    return url
  }

  url = await startLocalServer().catch(() => url)
  return url
}

describe('Destination Tests', () => {
  // needs to be written as a string so it's not transpiled
  const code = `(async () => {
    await window.analytics.identify('Test', {
      email: 'test@mctesting.org',
    })
    
    await window.analytics.track('Track!', {
      leProp: 'propé',
    })
    
    await window.analytics.page()
  })()`

  // This won't be run actively in CI until all destinations and test cases are 100% fixed
  test.concurrent.skip.each(destinations)(`%p`, async (destination) => {
    const key = destination as keyof typeof samples
    const writeKey = samples[key][0]
    const url = await server()

    const results = await run(url, writeKey, code)

    const classicReqs = results.classic.networkRequests
      .map((n) => new URL(n.url).host)
      .sort()

    const nextReqs = results.next.networkRequests
      .map((n) => new URL(n.url).host)
      .sort()

    expect(nextReqs).not.toEqual([])
    const missing = difference(classicReqs, nextReqs)

    expect(missing).toEqual([])
    expect(nextReqs).toEqual(expect.arrayContaining(classicReqs))
  })
})
