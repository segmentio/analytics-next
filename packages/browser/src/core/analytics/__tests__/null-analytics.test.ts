import { getAjsBrowserStorage } from '../../../test-helpers/browser-storage'
import { Analytics, NullAnalytics } from '..'

describe(NullAnalytics, () => {
  it('should return an instance of Analytics / NullAnalytics', () => {
    const analytics = new NullAnalytics()
    expect(analytics).toBeInstanceOf(Analytics)
    expect(analytics).toBeInstanceOf(NullAnalytics)
  })

  it('should have initialized set to true', () => {
    const analytics = new NullAnalytics()
    expect(analytics.initialized).toBe(true)
  })

  it('should have no plugins', async () => {
    const analytics = new NullAnalytics()
    expect(analytics.queue.plugins).toHaveLength(0)
  })
  it('should dispatch events', async () => {
    const analytics = new NullAnalytics()
    const ctx = await analytics.track('foo')
    expect(ctx.event.event).toBe('foo')
  })

  it('should have disableClientPersistence set to true', () => {
    const analytics = new NullAnalytics()
    expect(analytics.options.disableClientPersistence).toBe(true)
  })

  it('integration: should not touch cookies or localStorage', async () => {
    const analytics = new NullAnalytics()
    await analytics.track('foo')
    const storage = getAjsBrowserStorage()
    expect(Object.values(storage).every((v) => !v)).toBe(true)
  })
})
