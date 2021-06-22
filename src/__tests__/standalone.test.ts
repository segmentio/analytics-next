import jsdom, { JSDOM } from 'jsdom'
import { LegacySettings } from '../browser'
import { snippet } from '../tester/__fixtures__/segment-snippet'
import { pWhile } from '../lib/p-while'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'

const cdnResponse: LegacySettings = {
  integrations: {
    Zapier: {
      type: 'server',
    },
    'Amazon S3': {},
    Amplitude: {
      type: 'browser',
    },
    Segmentio: {
      type: 'browser',
    },
    Iterable: {
      type: 'browser',
      name: 'Iterable',
    },
  },
}

const fetchSettings = Promise.resolve({
  json: () => Promise.resolve(cdnResponse),
})

jest.mock('unfetch', () => {
  return jest.fn()
})

describe('standalone bundle', () => {
  const segmentDotCom = `***REMOVED***`

  let jsd: JSDOM

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

    // @ts-ignore ignore Response required fields
    mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)

    const html = `
    <!DOCTYPE html>
      <head>
        <script>
          ${snippet(segmentDotCom, true)}
        </script>
      </head>
      <body>
      </body>
    </html>
    `.trim()

    const virtualConsole = new jsdom.VirtualConsole()
    jsd = new JSDOM(html, {
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

  it('loads AJS on execution', async () => {
    await import('../standalone')

    await pWhile(
      () => window.analytics?.initialized !== true,
      () => {}
    )

    expect(window.analytics).not.toBeUndefined()
    expect(window.analytics.initialized).toBe(true)
  })

  it.skip('reverts to ajs classic in case of CSP errors', async () => {
    await import('../standalone')

    jsd.window.document.dispatchEvent(
      new jsd.window.Event('securitypolicyviolation', {
        // @ts-ignore jsdom doesn't implement the specific event we need :'(
        blockedURI: 'cdn.segment.com',
      })
    )

    const getClassic = (): HTMLScriptElement | undefined =>
      Array.from(document.scripts).find((s) =>
        s.getAttribute('src')?.includes('classic')
      )

    await pWhile(
      () => getClassic() === undefined,
      () => {}
    )

    expect(getClassic()).toMatchInlineSnapshot()
  })
})
