import { Analytics } from '../../../core/analytics'
import { pageEnrichment, pageDefaults } from '..'
import { pick } from '../../../lib/pick'

let ajs: Analytics

const helpers = {
  get pageProps() {
    return {
      url: 'http://foo.com/bar?foo=hello_world',
      path: '/bar',
      search: '?foo=hello_world',
      referrer: 'http://google.com',
      title: 'Hello World',
    }
  },
}

describe('Page Enrichment', () => {
  beforeEach(async () => {
    ajs = new Analytics({
      writeKey: 'abc_123',
    })

    await ajs.register(pageEnrichment)
  })

  test('enriches page calls', async () => {
    const ctx = await ajs.page('Checkout', {})

    expect(ctx.event.properties).toMatchInlineSnapshot(`
      Object {
        "name": "Checkout",
        "path": "/",
        "referrer": "",
        "search": "",
        "title": "",
        "url": "http://localhost/",
      }
    `)
  })

  test('enriches track events with the page context', async () => {
    const ctx = await ajs.track('My event', {
      banana: 'phone',
    })

    expect(ctx.event.context?.page).toMatchInlineSnapshot(`
      Object {
        "path": "/",
        "referrer": "",
        "search": "",
        "title": "",
        "url": "http://localhost/",
      }
    `)
  })

  describe('event.properties override behavior', () => {
    test('special page properties in event.properties (url, referrer, etc) are copied to context.page', async () => {
      const eventProps = { ...helpers.pageProps }
      ;(eventProps as any)['should_not_show_up'] = 'hello'
      const ctx = await ajs.track('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(
        pick(eventProps, ['url', 'path', 'referrer', 'search', 'title'])
      )
    })

    test('event page properties should not be mutated', async () => {
      const eventProps = { ...helpers.pageProps }
      const ctx = await ajs.track('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(eventProps)
    })

    test('page properties should have defaults', async () => {
      const eventProps = pick(helpers.pageProps, ['path', 'referrer'])
      const ctx = await ajs.track('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual({
        ...eventProps,
        url: 'http://localhost/',
        search: '',
        title: '',
      })
    })

    test('undefined / null / empty string properties on event get overridden as usual', async () => {
      const eventProps = { ...helpers.pageProps }
      eventProps.referrer = ''
      eventProps.path = undefined as any
      eventProps.title = null as any
      const ctx = await ajs.track('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(
        expect.objectContaining({ referrer: '', path: undefined, title: null })
      )
    })
  })

  test('enriches page events with the page context', async () => {
    const ctx = await ajs.page(
      'My event',
      { banana: 'phone' },
      { page: { url: 'not-localhost' } }
    )

    expect(ctx.event.context?.page).toMatchInlineSnapshot(`
          Object {
            "path": "/",
            "referrer": "",
            "search": "",
            "title": "",
            "url": "not-localhost",
          }
      `)
  })
  test('enriches page events using properties', async () => {
    const ctx = await ajs.page('My event', { banana: 'phone', referrer: 'foo' })

    expect(ctx.event.context?.page).toMatchInlineSnapshot(`
          Object {
            "path": "/",
            "referrer": "foo",
            "search": "",
            "title": "",
            "url": "http://localhost/",
          }
      `)
  })

  test('in page events, event.name overrides event.properties.name', async () => {
    const ctx = await ajs.page('My Event', undefined, undefined, {
      name: 'some propery name',
    })
    expect(ctx.event.properties!.name).toBe('My Event')
  })

  test('in non-page events, event.name does not override event.properties.name', async () => {
    const ctx = await ajs.track('My Event', {
      name: 'some propery name',
    })
    expect(ctx.event.properties!.name).toBe('some propery name')
  })

  test('enriches identify events with the page context', async () => {
    const ctx = await ajs.identify('Netto', {
      banana: 'phone',
    })

    expect(ctx.event.context?.page).toMatchInlineSnapshot(`
      Object {
        "path": "/",
        "referrer": "",
        "search": "",
        "title": "",
        "url": "http://localhost/",
      }
    `)
  })

  test('runs before any other plugin', async () => {
    let called = false

    await ajs.addSourceMiddleware(({ payload, next }) => {
      called = true
      expect(payload.obj?.context?.page).not.toBeFalsy()
      next(payload)
    })

    await ajs.track('My event', {
      banana: 'phone',
    })

    expect(called).toBe(true)
  })
})

describe('pageDefaults', () => {
  const el = document.createElement('link')
  el.setAttribute('rel', 'canonical')

  beforeEach(() => {
    el.setAttribute('href', '')
    document.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('handles no canonical links', () => {
    const defs = pageDefaults()
    expect(defs.url).not.toBeNull()
  })

  it('handles canonical links', () => {
    el.setAttribute('href', 'http://www.segment.local')
    document.body.appendChild(el)
    const defs = pageDefaults()
    expect(defs.url).toEqual('http://www.segment.local')
  })

  it('handles canonical links with a path', () => {
    el.setAttribute('href', 'http://www.segment.local/test')
    document.body.appendChild(el)
    const defs = pageDefaults()
    expect(defs.url).toEqual('http://www.segment.local/test')
    expect(defs.path).toEqual('/test')
  })

  it('handles canonical links with search params in the url', () => {
    el.setAttribute('href', 'http://www.segment.local?test=true')
    document.body.appendChild(el)
    const defs = pageDefaults()
    expect(defs.url).toEqual('http://www.segment.local?test=true')
  })

  it('if canonical does not exist, returns fallback', () => {
    document.body.appendChild(el)
    const defs = pageDefaults()
    expect(defs.url).toEqual(window.location.href)
  })
})
