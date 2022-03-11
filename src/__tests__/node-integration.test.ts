import { loadNode } from '../node'

const writeKey = 'foo'

describe('Initialization', () => {
  it('loads analytics-node-next plugin', async () => {
    const [analytics] = await loadNode({
      writeKey,
    })

    expect(analytics.queue.plugins.length).toBe(2)

    const ajsNodeXt = analytics.queue.plugins.find(
      (xt) => xt.name === 'analytics-node-next'
    )
    expect(ajsNodeXt).toBeDefined()
    expect(ajsNodeXt?.isLoaded()).toBeTruthy()
  })
})
