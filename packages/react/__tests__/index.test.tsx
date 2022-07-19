import React from 'react'
import { render } from '@testing-library/react'

import { AnalyticsProvider, createClient, useAnalytics } from '../src'
import { LegacySettings } from '@segment/analytics-next'

const cdnResponse: LegacySettings = {
  integrations: {},
}

const fetchSettings = Promise.resolve({
  json: () => Promise.resolve(cdnResponse),
})

jest.mock('unfetch', () => {
  return () => fetchSettings
})

describe('Analytics React', () => {
  it('creates a client accessible across all descendent components', () => {
    const segmentClient = createClient({ writeKey: 'abc' })

    const Header = () => {
      const analytics = useAnalytics()

      expect(analytics).toBe(segmentClient)

      expect(analytics).toMatchObject({
        track: expect.any(Function),
        page: expect.any(Function),
        identify: expect.any(Function),
      })

      return null
    }

    const App = () => (
      <AnalyticsProvider client={segmentClient}>
        <Header />
      </AnalyticsProvider>
    )

    render(<App />)
  })

  it('has pre-bound methods on client that can be destructured and still work', async () => {
    const segmentClient = createClient({ writeKey: 'abc' })
    const { track, page } = segmentClient

    expect(await track('Test event')).toMatchObject({
      event: { event: 'Test event', type: 'track' },
    })

    expect(await page('Test page')).toMatchObject({
      event: { properties: { name: 'Test page' }, type: 'page' },
    })
  })

  it('throws if useAnalytics is used in non-descendent of AnalyticsProvider', () => {
    const Header = () => {
      useAnalytics()

      return null
    }

    expect(() => render(<Header />)).toThrow(
      'Analytics client not found. Make sure `AnalyticsProvider` is an ancestor of this component'
    )
  })

  it('throws if AnalyticsProvider is given a bad client', () => {
    const App = () => (
      <AnalyticsProvider client={{} as any}>
        <div />
      </AnalyticsProvider>
    )

    expect(() => render(<App />)).toThrow(
      'Invalid Segment `client`. Make sure you are using `createClient` correctly'
    )
  })
})
