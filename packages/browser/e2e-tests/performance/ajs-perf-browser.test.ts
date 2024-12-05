import { tester, testerTeardown } from '../../src/tester/ajs-tester'
import {
  gatherLighthouseMetrics,
  globalSetup,
  globalTeardown,
} from '../../src/tester/ajs-perf'
import { TEST_WRITEKEY } from '../../src/test-helpers/test-writekeys'

describe('Performance', () => {
  beforeAll(async () => {
    await globalSetup()
  })

  afterAll(async () => {
    await globalTeardown()
    await testerTeardown()
  })

  // These tests are now biased because of the massive number of tests running during our QA process
  it('gather lighthouse', async () => {
    const analyticsStub = await tester(
      TEST_WRITEKEY,
      'http://localhost:3001',
      'chromium',
      true
    )

    const results: any = await gatherLighthouseMetrics(analyticsStub.browserPage)
    const audits = results.audits // Lighthouse audits

    // lighthouse perf score
    expect(results['categories'].performance.score).toBeGreaterThanOrEqual(0.99)
    // no render blocking resource
    expect(audits['render-blocking-resources'].details.items).toHaveLength(0)
    // first contentful paint in the first second
    expect(audits['first-contentful-paint'].numericValue).toBeLessThan(1000)

    // total blocking time less than 100ms
    expect(audits['total-blocking-time'].numericValue).toBeLessThan(150)
    // main thread work less than 100ms
    expect(audits['mainthread-work-breakdown'].numericValue).toBeLessThan(300)

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
  }, 50000)

  /* istanbul ignore next */
  it('loads ajs in a browser', async () => {
    const analyticsStub = await tester(
      TEST_WRITEKEY,
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
  }, 10000)
})
