import unfetch from 'unfetch'
import { Analytics, AnalyticsBrowser } from '../..'
import { PageContext } from '../../core/page'
import {
  cdnSettingsMinimal,
  createMockFetchImplementation,
} from '../../test-helpers/fixtures'

jest.mock('unfetch')
jest.mocked(unfetch).mockImplementation(createMockFetchImplementation())

let ajs: Analytics

beforeEach(async () => {
  const [analytics] = await AnalyticsBrowser.load({
    writeKey: 'abc_123',
    cdnSettings: { ...cdnSettingsMinimal },
  })
  ajs = analytics
})
describe('Page Enrichment', () => {
  it('enriches page calls', async () => {
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

  it('enriches track events with the page context', async () => {
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
    it('special page properties in event.properties (url, referrer, etc) are copied to context.page', async () => {
      const pageProps: PageContext & { [key: string]: unknown } = Object.freeze(
        {
          path: 'foo',
          referrer: 'bar',
          search: 'baz',
          title: 'qux',
          url: 'http://fake.com',
          should_not_show_up: 'hello',
        }
      )
      const ctx = await ajs.page('My Event', pageProps)
      const page = ctx.event.context!.page
      expect(page).toMatchInlineSnapshot(`
        Object {
          "path": "foo",
          "referrer": "bar",
          "search": "baz",
          "title": "qux",
          "url": "http://fake.com",
        }
      `)
    })

    it('special page properties in event.properties (url, referrer, etc) are not copied to context.page in non-page calls', async () => {
      const eventProps = Object.freeze({
        path: 'foo',
        referrer: 'bar',
        search: 'baz',
        url: 'http://fake.com',
        foo: 'hello',
      })
      const ctx = await ajs.track('My Event', eventProps)
      expect(ctx.event.properties).toMatchInlineSnapshot(`
        Object {
          "foo": "hello",
          "path": "foo",
          "referrer": "bar",
          "search": "baz",
          "url": "http://fake.com",
        }
      `)
      expect(ctx.event.context!.page).toMatchInlineSnapshot(`
        Object {
          "path": "/",
          "referrer": "",
          "search": "",
          "title": "",
          "url": "http://localhost/",
        }
      `)
    })

    it('page properties should override defaults in page calls', async () => {
      const pageProps = Object.freeze({ path: 'override' })
      const ctx = await ajs.page('My Event', pageProps)
      const page = ctx.event.context!.page
      expect(page).toMatchInlineSnapshot(`
        Object {
          "path": "override",
          "referrer": "",
          "search": "",
          "title": "",
          "url": "http://localhost/",
        }
      `)
    })

    it('undefined / null / empty string properties on event get overridden as usual', async () => {
      const eventProps = Object.freeze({
        referrer: '',
        path: undefined,
        title: null,
      })

      const ctx = await ajs.page('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(
        expect.objectContaining({ referrer: '', path: undefined, title: null })
      )
    })
  })

  it('enriches page events with the page context', async () => {
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
  it('enriches page events using properties', async () => {
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

  it('in page events, event.name overrides event.properties.name', async () => {
    const ctx = await ajs.page('My Event', undefined, undefined, {
      name: 'some propery name',
    })
    expect(ctx.event.properties!.name).toBe('My Event')
  })

  it('in non-page events, event.name does not override event.properties.name', async () => {
    const ctx = await ajs.track('My Event', {
      name: 'some propery name',
    })
    expect(ctx.event.properties!.name).toBe('some propery name')
  })

  it('enriches identify events with the page context', async () => {
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

  it('enriches before any other plugin', async () => {
    await ajs.addSourceMiddleware(({ payload, next }) => {
      expect(payload.obj?.context?.page).toMatchInlineSnapshot(`
        Object {
          "path": "/",
          "referrer": "",
          "search": "",
          "title": "",
          "url": "http://localhost/",
        }
      `)
      next(payload)
    })

    await ajs.track('My event', {
      banana: 'phone',
    })
    expect.assertions(1)
  })
})
