/**
 * Durability tests ensure that no events get "lost".
 */

import path from 'path'
import { ddos } from '../common/ddos'

const TOTAL_REQUESTS = 1000

const ddosWithPath = (basePath: string) =>
  ddos(path.join(__dirname, basePath), { amount: TOTAL_REQUESTS })

const test = async () => {
  const { serverReport: report } = await ddosWithPath(
    'server-start-analytics.ts'
  )

  if (report.totalBatchEvents !== TOTAL_REQUESTS) {
    throw new Error(
      `Events lost: total requests ${report.totalApiRequests}. expected requests: ${TOTAL_REQUESTS}`
    )
  }
  console.log(report)

  console.log('All event durability tests passed.')
}

test().catch((msg) => {
  console.error(`\n Node Durability Test failure \n`)
  console.log(msg)
  process.exit(1)
})
