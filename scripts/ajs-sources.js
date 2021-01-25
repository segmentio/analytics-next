#!/usr/bin/env ./node_modules/.bin/ts-node --script-mode --transpile-only --files

const ex = require('execa')

const robo = `robo --config ~/dev/src/github.com/segmentio/robofiles/development/robo.yml`

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

  while ((result = fetchPage(cursor))) {
    if (result.data.sources) {
      sources = sources.concat(result.data.sources)
    }

    cursor = result.data.pagination.next
    if (cursor === null) {
      break
    }
  }

  const rebuilds = sources.map(async (source) => {
    console.log('Rebuilding', {
      id: source.id,
      slug: source.slug,
      workspaceId: source.workspaceId,
      writeKeys: source.writeKeys.toString(),
    })

    return ex.command(`robo rebuild-ajs-prod ${source.id}`, {
      shell: true,
    })
  })

  // eslint-disable-next-line no-undef
  await Promise.all(rebuilds)
}

rebuild().catch(console.error)
