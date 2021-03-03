import { AJS_VERSION, cases } from './config'
import { navigate, writeJSONFile } from '.'
import { recordCalls } from './customRunner'

async function record(version: string) {
  const promises = cases.map(async (c) => {
    const { networkRequests, cookies, integrations = [] } = await navigate({
      c,
      recordCallsFunc: recordCalls,
      version,
    })

    await writeJSONFile(
      { networkRequests, cookies, integrations },
      `${c.name}-${version}`
    )
  })

  await Promise.all(promises)
}

record(AJS_VERSION).catch((err) => {
  console.error(err)
  process.exit(1)
})
