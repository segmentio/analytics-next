import { JSDOM, VirtualConsole } from 'jsdom'
import { getCDN } from '../parse-cdn'

async function withTag(tag: string) {
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

  await new Promise((resolve) => {
    jsd.window.addEventListener('load', () => resolve(undefined));
  });
}

beforeEach(async () => {
  jest.restoreAllMocks()
  jest.resetAllMocks()
})

it('detects the existing CDN', async () => {
  await withTag(`
    <script src="https://cdp.customer.io/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('should return the overridden cdn if window.analytics._cdn is mutated', async () => {
  await withTag(`
  <script src="https://cdp.customer.io/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  // @ts-ignore
  ;(window.analytics as any) = {
    _cdn: 'http://foo.cdn.com',
  }
  expect(getCDN()).toMatchInlineSnapshot(`"http://foo.cdn.com"`)
})

it('if analytics is not loaded yet, should still return cdn', async () => {
  // is this an impossible state?
  // @ts-ignore
  window.analytics = undefined as any
  await withTag(`
  <script src="https://cdp.customer.io/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('detects custom cdns that match in domain instrumentation patterns', async () => {
  await withTag(`
    <script src="https://my.cdn.domain/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://my.cdn.domain"`)
})

it('detects custom cdns if the write key has : in it', async () => {
  await withTag(`
    <script src="https://my.cdn.domain/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZv:CF6czfBcfzNO6/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://my.cdn.domain"`)
})

it('falls back if CDN is used as a proxy', async () => {
  await withTag(`
    <script src="https://my.cdn.proxy/custom-analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('falls back if the script is not at all present on the page', async () => {
  await withTag('')
  expect(getCDN()).toMatchInlineSnapshot(`"https://cdp.customer.io"`)
})

it('detects localhost with port', async () => {
  await withTag(`
    <script src="http://localhost:3000/v1/analytics-js/snippet/gA5MBlJXrtZaB5sMMZv/analytics.min.js" />
  `)
  expect(getCDN()).toMatchInlineSnapshot(`"http://localhost:3000"`)
})
