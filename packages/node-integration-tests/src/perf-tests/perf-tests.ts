import path from 'path'
import { runAutocannon } from './autocannon'
import { execFile } from 'child_process'
import { sleep } from '@internal/test-helpers'

const execAndKill = async (moduleName: string) => {
  const modulePath = path.join(__dirname, moduleName)
  console.log(`\n *** Executing ${moduleName}... *** \n`)
  const child = execFile('ts-node', [modulePath])
  await sleep(3000) // wait some amount of time for the server to come online before running autocannon, otherwise we will get connection errors.
  const { requests, errors } = await runAutocannon()
  child.kill()
  console.log(
    `--> There were ${errors} connection errors (including timeouts) out of ${requests.total} total requests.`
  )
  await sleep(1000)
  return requests
}

const calcPercDiff = (avg1: number, avg2: number) => {
  return parseFloat(((avg1 / avg2 - 1) * 100).toFixed(2))
}

const thresholds = {
  // TODO: Tweak thresholds to 50%, 1% respectively once batching comes in
  SDK_OVERHEAD_THRESHOLD: -75, // max percentage worse perf of an app with vs without analytics
  NEW_OLD_THRESHOLD: -50, // max percentage worse perf of an app using the new sdk vs old one
}

const test = async () => {
  const errors = []
  const analyticsReport = await execAndKill('server-start-analytics.ts')
  const noAnalyticsReport = await execAndKill('server-start-no-analytics.ts')
  const oldAnalyticsReport = await execAndKill('server-start-old-analytics.ts')
  const overheadDiff = calcPercDiff(
    analyticsReport.average,
    noAnalyticsReport.average
  )
  let report = `
    SDK Overhead
    with: ${analyticsReport.average} (Requests per second)
    without: ${noAnalyticsReport.average} (Requests per second)
    Diff performance: ${overheadDiff} %`

  console.log(report)

  if (overheadDiff <= thresholds.SDK_OVERHEAD_THRESHOLD) {
    errors.push([
      `perf difference: ${overheadDiff} has exceeded the threshold of ${thresholds.SDK_OVERHEAD_THRESHOLD}`,
    ])
  }

  console.log('-------------------------------------------------------')
  const newOldDiff = calcPercDiff(
    analyticsReport.average,
    oldAnalyticsReport.average
  )

  report = `
  New vs. Old SDK
  new: ${analyticsReport.average} (Requests per second)
  old: ${oldAnalyticsReport.average} (Requests per second)
  Diff performance: ${newOldDiff} %`

  console.log(report)

  if (newOldDiff <= thresholds.NEW_OLD_THRESHOLD) {
    errors.push([
      `perf difference: ${newOldDiff} has exceeded the threshold of ${thresholds.NEW_OLD_THRESHOLD}`,
    ])
  }

  if (errors.length) {
    throw new Error(errors.join('\n'))
  }
}

test().catch((msg) => {
  console.log(`\n Node perf-test failure \n`)
  console.log(msg)
  process.exit(1)
})
