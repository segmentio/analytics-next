#!/usr/bin/env ./node_modules/.bin/ts-node --script-mode --transpile-only --files

const ex = require('execa')

const robo = `robo --config ~/dev/src/github.com/segmentio/robofiles/development/robo.yml`

const sqsURL = `https://sqs.us-west-2.amazonaws.com/752180062774/ajs-renderer-sqs`

function fetchPage(cursor) {
  let params = `?pagination.count=100`
  if (cursor) {
    params += `\\&pagination.cursor=${cursor}`
  }

  const url = `http://control-plane-service.segment.local/analytics-next-sources${params}`
  const curl = `curl -s ${url} -H "User-Agent: Segment (ajs-next)" -H "Skip-Authz: 1"`
  const out = ex.commandSync(`echo '${curl}' | ${robo} prod.ssh`, {
    shell: true,
  })

  return JSON.parse(out.stdout)
}

async function rebuild() {
  let sources = []
  let result
  let cursor
  const commands = []

  while ((result = fetchPage(cursor))) {
    if (result.data.sources) {
      sources = sources.concat(result.data.sources)

      const chunk = result.data.sources.map((source) => {
        console.log('Enqueueing', {
          id: source.id,
          slug: source.slug,
          workspaceId: source.workspaceId,
          writeKeys: source.writeKeys.toString(),
        })

        const command = `aws sqs send-message --queue-url ${sqsURL} --message-body "${source.id}"`

        return ex.command(command, {
          shell: true,
        })
      })

      commands.push(chunk)
    }

    cursor = result.data.pagination.next
    if (cursor === null) {
      break
    }
  }

  const promises = commands.map(async (cmd) => {
    try {
      // eslint-disable-next-line no-undef
      await Promise.all(cmd)
    } catch (e) {
      console.error(e)
    }
  })

  // eslint-disable-next-line no-undef
  await Promise.all(promises)
}

rebuild().catch(console.error)
