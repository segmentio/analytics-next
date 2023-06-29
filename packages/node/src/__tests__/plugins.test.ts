import { TestFetchClient } from './test-helpers/factories'
import { createTestAnalytics } from './test-helpers/create-test-analytics'

const testClient = new TestFetchClient()

describe('Plugins', () => {
  beforeEach(() => {
    testClient.reset()
  })

  describe('Initialize', () => {
    it('loads analytics-node-next plugin', async () => {
      const analytics = createTestAnalytics()
      await analytics.ready

      const ajsNodeXt = analytics['_queue'].plugins.find(
        (xt) => xt.name === 'Segment.io'
      )
      expect(ajsNodeXt).toBeDefined()
      expect(ajsNodeXt?.isLoaded()).toBeTruthy()
    })
  })
})
