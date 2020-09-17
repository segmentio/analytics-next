import { Analytics } from '@/core'

const writeKey = '***REMOVED***'

describe('Segment', () => {
  it('delivers track events', async () => {
    // Segment is already registered as an extension
    const ajs = await Analytics.load({
      writeKey,
    })

    await ajs.track('Analytics Next Test Event', {
      prop: 'abc',
    })

    await ajs.queue.flush()
  })
})
