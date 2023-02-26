import { ddos } from '../common/ddos'
import path from 'path'

const hr = () =>
  console.log('\n*****************************************************\n')

const calcPercDiff = (avg1: number, avg2: number) => {
  return parseFloat(((avg1 / avg2 - 1) * 100).toFixed(2))
}

// Threshold is the max percentage worse performance.
// e.g. -10 is "no more than 10% worse performance than X". +10 is "no less than 10% better than X".
const thresholds = {
  SDK_OVERHEAD_THRESHOLD: -60,
  NEW_OLD_THRESHOLD: -10,
}

const ddosWithPath = (basePath: string) => ddos(path.join(__dirname, basePath))

const test = async () => {
  const errors = []
  const noAnalyticsReport = await ddosWithPath('server-start-no-analytics.ts')
  const analyticsReport = await ddosWithPath('server-start-analytics.ts')
  const oldAnalyticsReport = await ddosWithPath('server-start-old-analytics.ts')
  const overheadDiff = calcPercDiff(
    analyticsReport.autocannon.average,
    noAnalyticsReport.autocannon.average
  )
  console.log('REPORT: \n')
  let report = `
    SDK Overhead
    with: ${analyticsReport.autocannon.average} (Requests per second)
    without: ${noAnalyticsReport.autocannon.average} (Requests per second)
    Diff performance: ${overheadDiff} %`

  console.log(report)

  if (overheadDiff <= thresholds.SDK_OVERHEAD_THRESHOLD) {
    errors.push([
      `perf difference: ${overheadDiff} has exceeded the threshold of ${thresholds.SDK_OVERHEAD_THRESHOLD}`,
    ])
  }

  hr()
  const newOldDiff = calcPercDiff(
    analyticsReport.autocannon.average,
    oldAnalyticsReport.autocannon.average
  )

  report = `
  New vs. Old SDK
  new: ${analyticsReport.autocannon.average} (Requests per second)
  old: ${oldAnalyticsReport.autocannon.average} (Requests per second)
  Diff performance: ${newOldDiff} %`

  console.log(report)
  hr()

  if (newOldDiff <= thresholds.NEW_OLD_THRESHOLD) {
    errors.push([
      `perf difference: ${newOldDiff} has exceeded the threshold of ${thresholds.NEW_OLD_THRESHOLD}`,
    ])
  }

  if (errors.length) {
    throw new Error(errors.join('\n'))
  }

  console.log(`\n All performance tests passed.`)
}

test().catch((msg) => {
  console.log(`\n Node perf-test failure \n`)
  console.log(msg)
  process.exit(1)
})
