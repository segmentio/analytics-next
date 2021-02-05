import jsdom, { JSDOM } from 'jsdom'
import { AnalyticsBrowser, loadLegacySettings } from '../browser'
import { snippet } from '../tester/__fixtures__/segment-snippet'
import { install } from '../standalone-analytics'
import { Analytics } from '../analytics'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'

const fetchSettings = Promise.resolve({
  json: () => Promise.resolve(),
})

jest.mock('unfetch', () => {
  return jest.fn()
})

describe('standalone bundle', () => {
  const segmentDotCom = `***REMOVED***`

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
    <!DOCTYPE html>
      <head>
        <script>
          ${snippet(
            segmentDotCom,
            true,
            `
            window.analytics.track('fruit basket', { fruits: ['🍌', '🍇'] })
            window.analytics.identify('netto', { employer: 'segment' })
          `
          )}
        </script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    const virtualConsole = new jsdom.VirtualConsole()
    const jsd = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://segment.com',
      virtualConsole,
    })

    const windowSpy = jest.spyOn(global, 'window', 'get')
    const documentSpy = jest.spyOn(global, 'document', 'get')

    jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

    windowSpy.mockImplementation(() => {
      return (jsd.window as unknown) as Window & typeof globalThis
    })

    documentSpy.mockImplementation(
      () => (jsd.window.document as unknown) as Document
    )
  })

  it('derives the write key from scripts on the page', async () => {
    const fakeAjs = {}
    const spy = jest
      .spyOn(AnalyticsBrowser, 'standalone')
      .mockResolvedValueOnce((fakeAjs as unknown) as Analytics)

    await install()

    expect(spy).toHaveBeenCalledWith(segmentDotCom, {})
  })

  it('derives the CDN from scripts on the page', async () => {
    // @ts-ignore ignore Response required fields
    mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)
    await loadLegacySettings(segmentDotCom)
    expect(unfetch).toHaveBeenCalledWith(
      'https://cdn.foo.com/v1/projects/***REMOVED***/settings'
    )
  })

  it('runs any buffered operations after load', async () => {
    const fakeAjs = {
      track: jest.fn(),
      identify: jest.fn(),
      page: jest.fn(),
    }

    jest
      .spyOn(AnalyticsBrowser, 'standalone')
      .mockResolvedValueOnce((fakeAjs as unknown) as Analytics)

    await install()

    expect(fakeAjs.track).toHaveBeenCalledWith('fruit basket', {
      fruits: ['🍌', '🍇'],
    })
    expect(fakeAjs.identify).toHaveBeenCalledWith('netto', {
      employer: 'segment',
    })

    expect(fakeAjs.page).toHaveBeenCalled()
  })
})
