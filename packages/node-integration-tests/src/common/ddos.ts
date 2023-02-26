import { sleep } from '@internal/test-helpers'
import { fork } from 'child_process'
import { runAutocannon, RunAutocannonOptions } from '../server/autocannon'
import { ServerReport } from '../server/types'
import path from 'path'

/**
 * DDOS the specified server with autocannon
 */
export const ddos = async (
  serverFilePath: string,
  options?: RunAutocannonOptions
) => {
  console.log(`\n *** Executing ${path.basename(serverFilePath)}... *** \n`)

  const cp = fork(serverFilePath)

  // output stdout and stderr from script
  cp.stdout?.on('data', (msg) => console.log(msg))
  cp.stderr?.on('data', (err) => console.error(err))

  await sleep(3000) // wait some amount of time for the server to come online before running autocannon, otherwise we will get connection errors.

  const { requests, errors } = await runAutocannon(options)

  console.log(
    `autocannon --> There were ${requests.total} total requests and ${errors} connection errors (including timeouts).`
  )
  if (errors) {
    throw new Error(
      `There were connection errors when testing ${serverFilePath} -- has the server had enough time to initialize?`
    )
  }

  const serverReport = await new Promise<ServerReport>((resolve, reject) => {
    cp.on('message', (reportBuff) => {
      const report = JSON.parse(reportBuff.toString()) as ServerReport
      resolve(report)
    })
    cp.on('error', (err) => {
      reject(err)
    })
    cp.kill()
  })
  return { serverReport, autocannon: requests }
}
