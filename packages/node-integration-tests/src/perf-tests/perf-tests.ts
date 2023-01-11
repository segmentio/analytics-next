import path from 'path'
import { runAutocannon } from '../server/autocannon'
import { execFile } from 'child_process'
import { sleep } from '@internal/test-helpers'

const hr = () =>
  console.log('\n*****************************************************\n')

const execAndKill = async (moduleName: string) => {
  const modulePath = path.join(__dirname, moduleName)

  console.log(`\n *** Executing ${moduleName}... *** \n`)

  const cp = execFile('ts-node', [modulePath])

  // output stdout and stderr from script
  cp.stdout?.on('data', (msg) => console.log(msg))
  cp.stderr?.on('data', (err) => console.error(err))

  await sleep(3000) // wait some amount of time for the server to come online before running autocannon, otherwise we will get connection errors.

  const { requests, errors } = await runAutocannon()

  cp.kill()

  console.log(
    `--> There were ${requests.total} total requests and ${errors} connection errors (including timeouts).`
  )
  if (errors) {
    throw new Error(
      `There were connection errors when testing ${moduleName} -- has the server had enough time to initialize?`
    )
  }

  await sleep(3000) // wait 3 seconds to ensure port is freed up.
  return requests
}

const calcPercDiff = (avg1: number, avg2: number) => {
  return parseFloat(((avg1 / avg2 - 1) * 100).toFixed(2))
}

// Threshold is the max percentage worse performance.
// e.g. -10 is "no more than 10% worse performance than X". +10 is "no less than 10% better than X".
const thresholds = {
  SDK_OVERHEAD_THRESHOLD: -60,
  NEW_OLD_THRESHOLD: -10,
}

const test = async () => {
  const errors = []
  const noAnalyticsReport = await execAndKill('server-start-no-analytics.ts')
  const analyticsReport = await execAndKill('server-start-analytics.ts')
  const oldAnalyticsReport = await execAndKill('server-start-old-analytics.ts')
  const overheadDiff = calcPercDiff(
    analyticsReport.average,
    noAnalyticsReport.average
  )
  console.log('REPORT: \n')
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

  hr()
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
