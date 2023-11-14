import { getInitializedAnalytics } from '../get-initialized-analytics'

beforeEach(() => {
  delete (window as any).analytics
  delete (window as any).foo
})

describe(getInitializedAnalytics, () => {
  it('should return the window.analytics object if the snippet user passes a stale reference', () => {
    ;(window as any).analytics = { initialized: true }
    const analytics = [] as any
    expect(getInitializedAnalytics(analytics)).toEqual(
      (window as any).analytics
    )
  })

  it('should return the correct global analytics instance if the user has set a globalAnalyticsKey', () => {
    ;(window as any).foo = { initialized: true }
    const analytics = [] as any
    analytics._loadOptions = { globalAnalyticsKey: 'foo' }
    expect(getInitializedAnalytics(analytics)).toEqual((window as any).foo)
  })

  it('should return the buffered instance if analytics is not initialized', () => {
    const analytics = [] as any
    const globalAnalytics = { initialized: false }
    // @ts-ignore
    window['analytics'] = globalAnalytics
    expect(getInitializedAnalytics(analytics)).toEqual(analytics)
  })
  it('invariant: should not throw if global analytics is undefined', () => {
    ;(window as any).analytics = undefined
    const analytics = [] as any
    expect(getInitializedAnalytics(analytics)).toBe(analytics)
  })

  it('should return the analytics object if it is not an array', () => {
    const analytics = { initialized: false } as any
    expect(getInitializedAnalytics(analytics)).toBe(analytics)
  })
})
