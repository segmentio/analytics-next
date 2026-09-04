import { JSDOM, VirtualConsole } from 'jsdom'

// parse-cdn snapshots document.currentScript at first use, so each test needs a
// fresh module instance. We re-require it after wiring up the DOM.
let getCDN: typeof import('../parse-cdn').getCDN

/**
 * Render a document whose *loading* tag is `loaderSrc` (the one the browser
 * would expose as document.currentScript), plus any number of `extraTags` that
 * are present in the DOM but did NOT load the SDK (e.g. attacker-injected,
 * possibly inert). Pass loaderSrc = null to model a context where
 * document.currentScript is null (bundler/npm, async load, event handler).
 */
function withTags(loaderSrc: string | null, extraTags: string[] = []) {
  const tags = [...extraTags, ...(loaderSrc ? [loaderSrc] : [])]
    .map((src) => `<script src="${src}"></script>`)
    .join('\n')

  const html = `<!DOCTYPE html><head>${tags}</head><body></body>`.trim()

  const virtualConsole = new VirtualConsole()
  const jsd = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://segment.com',
    virtualConsole,
  })

  const doc = jsd.window.document

  // Point document.currentScript at the loader tag (the last one rendered),
  // shadowing the prototype getter that otherwise returns null in jsdom.
  const loaderEl = loaderSrc
    ? doc.querySelector(`script[src="${loaderSrc}"]`)
    : null
  Object.defineProperty(doc, 'currentScript', {
    configurable: true,
    get: () => loaderEl,
  })

  jest.spyOn(console, 'warn').mockImplementationOnce(() => {})
  jest
    .spyOn(global, 'window', 'get')
    .mockImplementation(
      () => jsd.window as unknown as Window & typeof globalThis
    )
  jest
    .spyOn(global, 'document', 'get')
    .mockImplementation(() => doc as unknown as Document)
}

beforeEach(async () => {
  jest.restoreAllMocks()
  jest.resetAllMocks()
  jest.resetModules()
  ;({ getCDN } = await import('../parse-cdn'))
})

const SEGMENT_TAG =
  'https://cdn.segment.com/analytics.js/v1/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js'
const CUSTOM_TAG =
  'https://my.cdn.domain/analytics.js/v1/gA5MBlJXrtZaB5sMMZvCF6czfBcfzNO6/analytics.min.js'
const EVIL_TAG = 'https://evil.example.com/x/analytics.js/v1/evilkey/platform'

it('detects the existing segment cdn from the loading tag', () => {
  withTags(SEGMENT_TAG)
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('returns the overridden cdn if window.analytics._cdn is set', () => {
  withTags(SEGMENT_TAG)
  ;(window as any).analytics = { _cdn: 'http://foo.cdn.com' }
  expect(getCDN()).toBe('http://foo.cdn.com')
})

it('detects custom / proxy cdns from the loading tag (proxy support preserved)', () => {
  withTags(CUSTOM_TAG)
  expect(getCDN()).toBe('https://my.cdn.domain')
})

it('falls back to Segment if the loading tag src does not match the pattern', () => {
  withTags('https://my.cdn.proxy/custom-analytics.min.js')
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('falls back to Segment if there is no loading tag (currentScript null)', () => {
  withTags(null)
  expect(getCDN()).toBe('https://cdn.segment.com')
})

// --- SECOPS-25767 regression tests ---------------------------------------

it('ignores a non-loading (injected) tag and trusts only the loader', () => {
  // legit tag loaded us; an attacker-injected evil tag is also in the DOM.
  withTags(SEGMENT_TAG, [EVIL_TAG])
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('does NOT trust an injected tag when there is no valid loader', () => {
  // no tag actually loaded us (currentScript null); an inert evil tag exists.
  withTags(null, [EVIL_TAG])
  expect(getCDN()).toBe('https://cdn.segment.com') // NOT evil.example.com
})

it('trusts the proxy loader even when an evil tag is also present', () => {
  withTags(CUSTOM_TAG, [EVIL_TAG])
  expect(getCDN()).toBe('https://my.cdn.domain')
})

// --- allowlisted fallback (no currentScript, e.g. bundler + snippet) --------

it('falls back to a public Segment CDN tag when currentScript is unavailable', () => {
  withTags(null, [SEGMENT_TAG])
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('does NOT trust a path under an allowlisted origin (greedy-prefix abuse)', () => {
  // The CDN base comes from the regex's greedy prefix capture, so a path under
  // an allowlisted host must not be accepted - otherwise anyone who can
  // publish under that path controls the settings we fetch.
  withTags(null, [
    'https://cdn.segment.com/npm/evil-pkg@1.0.0/analytics.js/v1/K/analytics.min.js',
  ])
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('does NOT trust a self-serve mirror (cdn.jsdelivr.net is not allowlisted)', () => {
  withTags(null, [
    'https://cdn.jsdelivr.net/npm/evil-pkg@1.0.0/analytics.js/v1/K/analytics.min.js',
  ])
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('does NOT fall back to a non-allowlisted tag (proxy) without currentScript', () => {
  // a real proxy tag, but we cannot prove it loaded us -> refuse to trust it
  withTags(null, [CUSTOM_TAG])
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('does NOT fall back to an evil tag that mimics an allowlisted host', () => {
  withTags(null, [
    'https://cdn.segment.com.evil.example.com/analytics.js/v1/k/analytics.min.js',
  ])
  expect(getCDN()).toBe('https://cdn.segment.com')
})

it('ignores an evil tag and picks the allowlisted one in the fallback scan', () => {
  withTags(null, [SEGMENT_TAG, EVIL_TAG])
  expect(getCDN()).toBe('https://cdn.segment.com')
})
