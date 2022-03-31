import { AnalyticsBrowser } from '..'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'

jest.mock('unfetch', () => {
  return jest.fn()
})

const writeKey = 'foo'

const settingsResponse = Promise.resolve({
  json: () =>
    Promise.resolve({
      integrations: {},
    }),
}) as Promise<Response>

mocked(unfetch).mockImplementation(() => settingsResponse)

it('supports overriding the CDN', async () => {
  const mockCdn = 'https://cdn.foo.com'

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
