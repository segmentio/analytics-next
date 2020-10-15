/* eslint-disable @typescript-eslint/no-floating-promises */
import { ajsDestinations } from '..'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'
import { Extension } from '../../../core/extension'
import { tester } from '../../../tester/ajs-tester'

const cdnResponse = {
  integrations: {
    Zapier: {
      type: 'server',
    },
    WithNoVersion: {
      type: 'browser',
    },
    WithLegacyVersion: {
      version: '3.0.7',
      type: 'browser',
    },
    WithVersionSettings: {
      versionSettings: {
        version: '1.2.3',
      },
      type: 'browser',
    },
    WithVersionOverrides: {
      versionSettings: {
        version: '1.2.3',
        override: '9.9.9',
      },
      type: 'browser',
    },
    'Amazon S3': {},
  },
}

jest.mock('unfetch', () => {
  return jest.fn()
})

const jsonPromise = Promise.resolve(cdnResponse)
const fetchSettings = Promise.resolve({
  json: () => jsonPromise,
})

let destinations: Extension[]

beforeEach(async () => {
  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore: ignore Response required fields
  mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)
  destinations = await ajsDestinations('fakeWriteKey', {})
})

describe('ajsDestinations', () => {
  // This test should temporary. Once we deprecate `version`, we can change it
  // to `it('loads version overrides')`
  it('considers both legacy and new version formats', () => {
    const withLegacyVersion = destinations.find((d) => d.name === 'WithLegacyVersion')
    const withVersionSettings = destinations.find((d) => d.name === 'WithVersionSettings')
    const withVersionOverrides = destinations.find((d) => d.name === 'WithVersionOverrides')
    const withNoVersion = destinations.find((d) => d.name === 'WithNoVersion')

    expect(withLegacyVersion?.version).toBe('3.0.7')
    expect(withVersionSettings?.version).toBe('1.2.3')
    expect(withVersionOverrides?.version).toBe('9.9.9')
    expect(withNoVersion?.version).toBe('latest')
  })

  it('loads type:browser legacy ajs destinations from cdn', () => {
    expect(destinations.length).toBe(4)
  })

  it('ignores destinations of type:server', () => {
    expect(destinations.find((d) => d.name === 'Zapier')).toBe(undefined)
  })
})

describe('ajsDestination', () => {
  it('loads integrations from the Segment CDN', async () => {
    const ajs = await tester('test')
    const page = ajs.puppeteerPage

    const allReqs: string[] = []

    page.on('request', (request) => {
      allReqs.push(request.url())
      request.continue()
    })

    await page.setRequestInterception(true)

    await page.evaluate(`
      const amplitude = window.AnalyticsNext.ajsDestination("amplitude", "latest", {})
      window.analytics.register(amplitude)
    `)

    expect(allReqs).toMatchInlineSnapshot(`
      Array [
        "https://cdn.segment.build/next-integrations/amplitude/latest/amplitude.js",
      ]
    `)

    // loads remote integration as an umd function
    await page.waitForFunction('window.amplitudeIntegration !== undefined')
  })

  it('executes and loads the third party integration', async () => {
    const ajs = await tester('test')
    const page = ajs.puppeteerPage

    const allReqs: string[] = []
    page.on('request', (request) => {
      allReqs.push(request.url())
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      request.continue()
    })

    await page.setRequestInterception(true)

    await page.evaluate(`
      const amplitude = window.AnalyticsNext.ajsDestination("amplitude", "latest", {
        apiKey: "***REMOVED***"
      })
      window.analytics.register(amplitude)
      window.amplitudeInstance = amplitude
    `)

    await page.waitForFunction('window.amplitudeInstance.isLoaded() === true')

    // loads remote amplitude
    expect(allReqs).toMatchInlineSnapshot(`
      Array [
        "https://cdn.segment.build/next-integrations/amplitude/latest/amplitude.js",
        "https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js",
      ]
    `)
  })

  it('forwards identify calls to integration', async () => {
    const ajs = await tester('test')
    const page = ajs.puppeteerPage

    const allReqs: string[] = []
    page.on('request', (request) => {
      allReqs.push(request.url())
      request.continue()
    })

    await page.setRequestInterception(true)

    await page.evaluate(`
      const amplitude = window.AnalyticsNext.ajsDestination("amplitude", "latest", {
        apiKey: "***REMOVED***"
      })
      window.analytics.register(amplitude)
      window.amplitudeInstance = amplitude
    `)
    await page.waitForFunction('window.amplitudeInstance.isLoaded() === true')
    await ajs.identify('Test User', { banana: 'phone' })

    // loads remote amplitude
    expect(allReqs).toMatchInlineSnapshot(`
      Array [
        "https://cdn.segment.build/next-integrations/amplitude/latest/amplitude.js",
        "https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js",
        "http://api.amplitude.com/",
      ]
    `)
  })

  it('forwards track calls to integration', async () => {
    const ajs = await tester('test')
    const page = ajs.puppeteerPage

    const allReqs: string[] = []
    page.on('request', (request) => {
      allReqs.push(request.url())
      request.continue()
    })

    await page.setRequestInterception(true)

    await page.evaluate(`
      const amplitude = window.AnalyticsNext.ajsDestination("amplitude", "latest", {
        apiKey: "***REMOVED***"
      })
      window.analytics.register(amplitude)
      window.amplitudeInstance = amplitude
    `)
    await page.waitForFunction('window.amplitudeInstance.isLoaded() === true')
    await ajs.identify('Test User', { banana: 'phone' })

    // loads remote amplitude
    expect(allReqs).toMatchInlineSnapshot(`
      Array [
        "https://cdn.segment.build/next-integrations/amplitude/latest/amplitude.js",
        "https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js",
        "http://api.amplitude.com/",
      ]
    `)
  })
})
