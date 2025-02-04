import { JSDOM, VirtualConsole } from 'jsdom'
import { getCDN } from '../parse-cdn'

function withTag(tag: string) {
  const html = `
    <!DOCTYPE html>
      <head>
        ${tag}
      </head>
      <body>
      </body>
    </html>
    `.trim()

  const virtualConsole = new VirtualConsole()
  const jsd = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost:3000',
    virtualConsole,
  })

  const windowSpy = jest.spyOn(global, 'window', 'get')

  const documentSpy = jest.spyOn(global, 'document', 'get')

  jest.spyOn(console, 'warn').mockImplementationOnce(() => {})

  windowSpy.mockImplementation(() => {
    return jsd.window as unknown as Window & typeof globalThis
  })

  documentSpy.mockImplementation(
    () => jsd.window.document as unknown as Document
  )
}

beforeEach(async () => {
  jest.restoreAllMocks()
  jest.resetAllMocks()
})

it('detects the existing CDN', () => {
  withTag(`
    <script src="https://cdp.customer.io/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('should return the overridden cdn if window.analytics._cdn is mutated', () => {
  withTag(`
  <script src="https://cdp.customer.io/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  // @ts-ignore
  ;(window.analytics as any) = {
    _cdn: 'http://foo.cdn.com',
  }
  expect(getCDN()).toMatchInlineSnapshot(`"http://foo.cdn.com"`)
})

it('if analytics is not loaded yet, should still return cdn', () => {
  // is this an impossible state?
  // @ts-ignore
  window.analytics = undefined as any
  withTag(`
  <script src="https://cdp.customer.io/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('detects custom cdns that match in domain instrumentation patterns', () => {
  withTag(`
    <script src="https://my.cdn.domain/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://my.cdn.domain"`)
})

it('detects custom cdns if the write key has : in it', () => {
  withTag(`
    <script src="https://my.cdn.domain/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZv:CF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://my.cdn.domain"`)
})

it('falls back if CDN is used as a proxy', () => {
  withTag(`
    <script src="https://my.cdn.proxy/custom-analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('falls back if the script is not at all present on the page', () => {
  withTag('')
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('detects localhost with port', () => {
  withTag(`
    <script src="http://localhost:3000/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZv/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"http://localhost:3000"`)
})
