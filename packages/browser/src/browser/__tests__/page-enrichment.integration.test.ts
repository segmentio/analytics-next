import { pick } from 'lodash'
import unfetch from 'unfetch'
import { Analytics, AnalyticsBrowser } from '../..'
import {
  createMockFetchImplementation,
  getPageCtxFixture,
} from '../../test-helpers/fixtures'

jest.mock('unfetch')
jest.mocked(unfetch).mockImplementation(createMockFetchImplementation())

let ajs: Analytics

beforeEach(async () => {
  await AnalyticsBrowser.load({
    writeKey: 'abc_123',
    cdnSettings: { integrations: {} },
  }).then(([analytics]) => {
    ajs = analytics
  })
})
describe('Page Enrichment', () => {
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
      const eventProps = getPageCtxFixture()
      ;(eventProps as any)['should_not_show_up'] = 'hello'
      const ctx = await ajs.page('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(
        pick(eventProps, ['url', 'path', 'referrer', 'search', 'title'])
      )
    })

    test('special page properties in event.properties (url, referrer, etc) are not copied to context.page in non-page calls', async () => {
      const eventProps = getPageCtxFixture()
      ;(eventProps as any)['should_not_show_up'] = 'hello'
      const ctx = await ajs.track('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toMatchInlineSnapshot(`
      Object {
        "path": "/",
        "referrer": "",
        "search": "",
        "title": "",
        "url": "http://localhost/",
      }
    `)
    })

    test('event page properties should not be mutated', async () => {
      const eventProps = getPageCtxFixture()
      const ctx = await ajs.page('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(eventProps)
    })

    test('page properties should have defaults', async () => {
      const eventProps = pick(getPageCtxFixture(), ['path', 'referrer'])
      const ctx = await ajs.page('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual({
        ...eventProps,
        url: 'http://localhost/',
        search: '',
        title: '',
      })
    })

    test('undefined / null / empty string properties on event get overridden as usual', async () => {
      const eventProps = getPageCtxFixture()
      eventProps.referrer = ''
      eventProps.path = undefined as any
      eventProps.title = null as any
      const ctx = await ajs.page('My Event', eventProps)
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
