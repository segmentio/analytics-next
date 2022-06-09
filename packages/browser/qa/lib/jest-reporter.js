const fetch = require('node-fetch')
const ex = require('execa')

const btoa = (val) => Buffer.from(val).toString('base64')

const getBranch = async () =>
  (await ex('git', ['branch', '--show-current'])).stdout

const assertEnvVariable = (name) => {
  if (process.env[name] !== undefined) return
  throw new Error(`process.env.${name} is undefined`)
}

async function increment(metric, value = 0, tags = []) {
  assertEnvVariable('STATS_WRITEKEY')

  const event = {
    event: metric,
    properties: {
      value,
      tags,
      type: 'count',
    },
    userId: 'system',
  }

  return fetch(`https://api.segment.io/v1/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'analytics-node-next/latest',
      Authorization: `Basic ${btoa(process.env.STATS_WRITEKEY)}`,
    },
    body: JSON.stringify(event),
  })
}

class CustomReporter {
  async onTestResult(_context, result) {
    const branch = process.env.BUILDKITE_BRANCH || (await getBranch())

    const metrics = result.testResults.map((res) => {
      return increment('test_run', 1, [
        `duration:${res.duration}`,
        `status:${res.status}`,
        `title:${res.title}`,
        `full_name:${res.fullName}`,
        `parent:${(res.ancestorTitles || []).join('.')}`,
        `branch:${branch}`,
      ])
    })

    await Promise.all(metrics).catch(console.error)
  }
}

module.exports = CustomReporter
