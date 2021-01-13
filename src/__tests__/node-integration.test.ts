import { AnalyticsNode } from '../node'

const writeKey = '***REMOVED***'

describe('Initialization', () => {
  it('loads analytics-node-next extension', async () => {
    const [analytics] = await AnalyticsNode.load({
      writeKey,
    })

    expect(analytics.queue.extensions.length).toBe(2)

    const ajsNodeXt = analytics.queue.extensions.find(
      (xt) => xt.name === 'analytics-node-next'
    )
    expect(ajsNodeXt).toBeDefined()
    expect(ajsNodeXt?.isLoaded()).toBeTruthy()
  })
})
