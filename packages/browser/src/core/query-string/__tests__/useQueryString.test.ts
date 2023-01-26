import unfetch from 'unfetch'
import { AnalyticsBrowser } from '../../..'
import { createSuccess } from '../../../test-helpers/factories'

jest.mock('unfetch')
jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

// @ts-ignore
delete window.location
// @ts-ignore
window.location = new URL(
  'https://www.example.com?ajs_aid=873832VB&ajs_uid=xcvn7568'
)

describe('useQueryString configuration option', () => {
  it('ignores aid and uid from query string when disabled', async () => {
    const [analyticsAlt] = await AnalyticsBrowser.load(
      { writeKey: 'abc' },
      {
        useQueryString: false,
      }
    )

    // not acknowledge the aid provided in the query params, let ajs generate one
    expect(analyticsAlt.user().anonymousId()).not.toBe('873832VB')
    expect(analyticsAlt.user().id()).toBe(null)
  })

  it('ignores uid when it doesnt match the required pattern', async () => {
    const [analyticsAlt] = await AnalyticsBrowser.load(
      { writeKey: 'abc' },
      {
        useQueryString: {
          uid: /[A-Z]{6}/,
        },
      }
    )

    // no constraint was set for aid therefore accepted
    expect(analyticsAlt.user().anonymousId()).toBe('873832VB')
    expect(analyticsAlt.user().id()).toBe(null)
  })

  it('accepts both aid and uid from query string when they match the required pattern', async () => {
    const [analyticsAlt] = await AnalyticsBrowser.load(
      { writeKey: 'abc' },
      {
        useQueryString: {
          aid: /\d{6}[A-Z]{2}/,
          uid: /[a-z]{4}\d{4}/,
        },
      }
    )

    expect(analyticsAlt.user().anonymousId()).toBe('873832VB')
    expect(analyticsAlt.user().id()).toBe('xcvn7568')
  })
})
