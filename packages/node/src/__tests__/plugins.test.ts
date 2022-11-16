const fetcher = jest.fn()
jest.mock('../lib/fetch', () => ({ fetch: fetcher }))

import { createSuccess } from './test-helpers/factories'
import { createTestAnalytics } from './test-helpers/create-test-analytics'

describe('Plugins', () => {
  beforeEach(() => {
    fetcher.mockReturnValue(createSuccess())
  })

  describe('Initialize', () => {
    it('loads analytics-node-next plugin', async () => {
      const analytics = createTestAnalytics()
      await analytics.ready

      const ajsNodeXt = analytics.queue.plugins.find(
        (xt) => xt.name === 'Segment.io'
      )
      expect(ajsNodeXt).toBeDefined()
      expect(ajsNodeXt?.isLoaded()).toBeTruthy()
    })
  })
})
