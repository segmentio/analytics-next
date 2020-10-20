import { tester } from '../../../tester/ajs-tester'

describe('ajsDestination', () => {
  it('loads integrations from the Segment CDN', async () => {
    const ajs = await tester('test')
    const page = ajs.browserPage

    const allReqs: string[] = []

    page.on('request', (request) => {
      allReqs.push(request.url())
    })

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
    const page = ajs.browserPage

    const allReqs: string[] = []
    page.on('request', (request) => {
      allReqs.push(request.url())
    })

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
    const page = ajs.browserPage

    const allReqs: string[] = []
    page.on('request', (request) => {
      allReqs.push(request.url())
    })

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
    const page = ajs.browserPage

    const allReqs: string[] = []
    page.on('request', (request) => {
      allReqs.push(request.url())
    })

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
