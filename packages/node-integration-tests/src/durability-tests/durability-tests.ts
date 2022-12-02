import path from 'path'
import { runAutocannon } from '../server/autocannon'
import { execFile } from 'child_process'
import { sleep } from '@internal/test-helpers'

const execAndKill = async (moduleName: string) => {
  const modulePath = path.join(__dirname, moduleName)

  console.log(`\n *** Executing ${moduleName}... *** \n`)

  const cp = execFile('ts-node', [modulePath])

  // output stdout and stderr from script
  cp.stdout?.on('data', (msg) => console.log(msg))
  cp.stderr?.on('data', (err) => console.error(err))

  await sleep(1000) // wait some amount of time for the server to come online before running autocannon, otherwise we will get connection errors.

  const { requests, errors } = await runAutocannon({ amount: 1000 })

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

const test = async () => {
  return execAndKill('server-start-analytics.ts')
}

test().catch((msg) => {
  console.error(`\n Node Durability Test failure \n`)
  console.log(msg)
  process.exit(1)
})
