import { tester, testerTeardown } from '../../src/tester/ajs-tester'
import {
  gatherLighthouseMetrics,
  globalSetup,
  globalTeardown,
} from '../../src/tester/ajs-perf'

describe('Performance', () => {
  beforeAll(async () => {
    await globalSetup()
  })

  afterAll(async () => {
    await globalTeardown()
    await testerTeardown()
  })

  it('gather lighthouse', async () => {
    jest.setTimeout(50000)

    const analyticsStub = await tester(
      '***REMOVED***',
      'http://localhost:3001',
      'chromium',
      true
    )

    const results = await gatherLighthouseMetrics(analyticsStub.browserPage)
    const audits = results.audits // Lighthouse audits

    // lighthouse perf score of 100
    expect(results['categories'].performance.score).toEqual(1)
    // no render blocking resource
    expect(audits['render-blocking-resources'].details.items).toHaveLength(0)
    // first contentful paint in the first second
    expect(audits['first-contentful-paint'].numericValue).toBeLessThan(1000)
    // total blocking time less than 100ms
    expect(audits['total-blocking-time'].numericValue).toBeLessThan(100)
    // main thread work less than 100ms
    expect(audits['mainthread-work-breakdown'].numericValue).toBeLessThan(200)
    // UMD bundle size less than ~34kb
    expect(audits['total-byte-weight'].numericValue).toBeLessThanOrEqual(40000)

    console.log('⚡️ AJS is blazing fast ⚡')
    console.table(
      Object.keys(audits)
        .filter((i) => audits[i].displayValue)
        .map((i) => ({
          metric: audits[i].title,
          value: audits[i].displayValue,
        }))
    )

    await analyticsStub.browserPage.close()
  })

  it('loads ajs in a browser', async () => {
    jest.setTimeout(10000)
    const analyticsStub = await tester(
      '***REMOVED***',
      'http://localhost:3001',
      'chromium',
      true
    )

    const ctx = await analyticsStub.track('hi', {
      test: 'prop',
    })

    expect(ctx.event.event).toEqual('hi')
    expect(ctx.event.properties).toEqual({
      test: 'prop',
    })

    await analyticsStub.browserPage.close()
  })
})
