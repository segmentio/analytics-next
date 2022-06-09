import { AnalyticsBrowser } from '../..'
import unfetch from 'unfetch'
import { createSuccess } from '../../test-helpers/factories'
import { setGlobalCDNUrl } from '../../lib/parse-cdn'

jest.mock('unfetch', () => {
  return jest.fn()
})

const writeKey = 'foo'

beforeEach(() => {
  setGlobalCDNUrl(undefined as any)
})

jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

it('supports overriding the CDN', async () => {
  const mockCdn = 'https://cdn.foobar.com'

  await AnalyticsBrowser.load({
    writeKey,
    cdnURL: mockCdn,
  })
  expect(unfetch).toBeCalledWith(expect.stringContaining(mockCdn))
})

it('should use the default CDN if not overridden', async () => {
  await AnalyticsBrowser.load({
    writeKey,
  })
  expect(unfetch).toBeCalledWith(
    expect.stringContaining('https://cdn.segment.com')
  )
})

it('if CDN is overridden, sets the overridden CDN global variable', async () => {
  const mockCdn = 'https://cdn.foo.com'

  ;(window as any).analytics = {}

  await AnalyticsBrowser.load({
    writeKey,
    cdnURL: mockCdn,
  })
  expect(window.analytics._cdn).toBe(mockCdn)
})
