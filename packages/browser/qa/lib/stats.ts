import { Analytics, Context } from '@segment/analytics-node'
import ex from 'execa'

const getBranch = async () =>
  (await ex('git', ['branch', '--show-current'])).stdout

function client(): Analytics {
  if (!process.env.STATS_WRITEKEY) {
    throw new Error('no process.env.STATS_WRITEKEY')
  }

  const analytics = new Analytics({
    writeKey: process.env.STATS_WRITEKEY,
    maxEventsInBatch: 1,
  })

  return analytics
}

export async function gauge(
  metric: string,
  value: number = 0,
  tags: string[] = []
) {
  const ajs = client()

  const branch = process.env.BUILDKITE_BRANCH || (await getBranch())

  const ctx = await new Promise<Context>((resolve, reject) =>
    ajs.track(
      {
        event: metric,
        properties: {
          value,
          tags: [...tags, `branch:${branch}`],
          type: 'gauge',
        },
        userId: 'system',
      },
      (err, res) => (err ? reject(err) : resolve(res!))
    )
  )

  return ctx
}
