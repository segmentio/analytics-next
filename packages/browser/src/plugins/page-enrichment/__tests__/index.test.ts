import cookie from 'js-cookie'
import assert from 'assert'
import { Analytics } from '../../../core/analytics'
import { pageEnrichment } from '..'
import { pick } from '../../../lib/pick'
import { SegmentioSettings } from '../../segmentio'
import { version } from '../../../generated/version'
import { CoreExtraContext } from '@segment/analytics-core'
import { UADataValues } from '../../../lib/client-hints/interfaces'
import {
  highEntropyTestData,
  lowEntropyTestData,
} from '../../../test-helpers/fixtures/client-hints'

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

/**
 * Filters out the calls made for probing cookie availability
 */
const ignoreProbeCookieWrites = (
  fn: jest.SpyInstance<
    string | undefined,
    [
      name: string,
      value: string | object,
      options?: cookie.CookieAttributes | undefined
    ]
  >
) => fn.mock.calls.filter((c) => c[0] !== 'ajs_cookies_check')

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
      const ctx = await ajs.page('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(
        pick(eventProps, ['url', 'path', 'referrer', 'search', 'title'])
      )
    })

    test('special page properties in event.properties (url, referrer, etc) are not copied to context.page in non-page calls', async () => {
      const eventProps = { ...helpers.pageProps }
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
      const eventProps = { ...helpers.pageProps }
      const ctx = await ajs.page('My Event', eventProps)
      const page = ctx.event.context!.page
      expect(page).toEqual(eventProps)
    })

    test('page properties should have defaults', async () => {
      const eventProps = pick(helpers.pageProps, ['path', 'referrer'])
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
      const eventProps = { ...helpers.pageProps }
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

describe('Other visitor metadata', () => {
  let options: SegmentioSettings
  let analytics: Analytics
  ;(window.navigator as any).userAgentData = {
    ...lowEntropyTestData,
    getHighEntropyValues: jest
      .fn()
      .mockImplementation((hints: string[]): Promise<UADataValues> => {
        let result = {}
        Object.entries(highEntropyTestData).forEach(([k, v]) => {
          if (hints.includes(k)) {
            result = {
              ...result,
              [k]: v,
            }
          }
        })
        return Promise.resolve({
          ...lowEntropyTestData,
          ...result,
        })
      }),
    toJSON: jest.fn(() => {
      return lowEntropyTestData
    }),
  }

  const amendSearchParams = (search?: any): CoreExtraContext => ({
    page: { search },
  })

  beforeEach(async () => {
    options = { apiKey: 'foo' }
    analytics = new Analytics({ writeKey: options.apiKey })

    await analytics.register(pageEnrichment)
  })

  afterEach(() => {
    analytics.reset()
    Object.keys(cookie.get()).map((k) => cookie.remove(k))

    if (window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('should add .timezone', async () => {
    const ctx = await analytics.track('test')
    assert(typeof ctx.event.context?.timezone === 'string')
  })

  it('should add .library', async () => {
    const ctx = await analytics.track('test')
    assert(ctx.event.context?.library)
    assert(ctx.event.context?.library.name === 'analytics.js')
    assert(ctx.event.context?.library.version === `npm:next-${version}`)
  })

  it('should allow override of .library', async () => {
    const customContext = {
      library: {
        name: 'analytics-wordpress',
        version: '1.0.3',
      },
    }

    const ctx = await analytics.track('test', {}, { context: customContext })

    assert(ctx.event.context?.library)
    assert(ctx.event.context?.library.name === 'analytics-wordpress')
    assert(ctx.event.context?.library.version === '1.0.3')
  })

  it('should add .userAgent', async () => {
    const ctx = await analytics.track('test')
    const removeVersionNum = (agent: string) => agent.replace(/jsdom\/.*/, '')
    const userAgent1 = removeVersionNum(ctx.event.context?.userAgent as string)
    const userAgent2 = removeVersionNum(navigator.userAgent)
    assert(userAgent1 === userAgent2)
  })

  it('should add .userAgentData when available', async () => {
    const ctx = await analytics.track('event')
    expect(ctx.event.context?.userAgentData).toEqual(lowEntropyTestData)
  })

  it('should add .locale', async () => {
    const ctx = await analytics.track('test')
    assert(ctx.event.context?.locale === navigator.language)
  })

  it('should not replace .locale if provided', async () => {
    const customContext = {
      locale: 'foobar',
    }

    const ctx = await analytics.track('test', {}, { context: customContext })
    assert(ctx.event.context?.locale === 'foobar')
  })

  it('should add .campaign', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams(
          'utm_source=source&utm_medium=medium&utm_term=term&utm_content=content&utm_campaign=name'
        ),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.campaign)
    assert(ctx.event.context.campaign.source === 'source')
    assert(ctx.event.context.campaign.medium === 'medium')
    assert(ctx.event.context.campaign.term === 'term')
    assert(ctx.event.context.campaign.content === 'content')
    assert(ctx.event.context.campaign.name === 'name')
  })

  it('should decode query params', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('?utm_source=%5BFoo%5D'),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.campaign)
    assert(ctx.event.context.campaign.source === '[Foo]')
  })

  it('should guard against undefined utm params', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('?utm_source'),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.campaign)
    assert(ctx.event.context.campaign.source === '')
  })

  it('should guard against empty utm params', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('?utm_source='),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.campaign)
    assert(ctx.event.context.campaign.source === '')
  })

  it('only parses utm params suffixed with _', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('?utm'),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert.deepStrictEqual(ctx.event.context.campaign, {})
  })

  it('should guard against short utm params', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('?utm_'),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert.deepStrictEqual(ctx.event.context.campaign, {})
  })

  it('should allow override of .campaign', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: {
          ...amendSearchParams(
            '?utm_source=source&utm_medium=medium&utm_term=term&utm_content=content&utm_campaign=name'
          ),
          campaign: {
            source: 'overrideSource',
            medium: 'overrideMedium',
            term: 'overrideTerm',
            content: 'overrideContent',
            name: 'overrideName',
          },
        },
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.campaign)
    assert(ctx.event.context.campaign.source === 'overrideSource')
    assert(ctx.event.context.campaign.medium === 'overrideMedium')
    assert(ctx.event.context.campaign.term === 'overrideTerm')
    assert(ctx.event.context.campaign.content === 'overrideContent')
    assert(ctx.event.context.campaign.name === 'overrideName')
  })

  it('should allow override of .search with object', async () => {
    const searchParams = {
      something_else: 'bar',
      utm_custom: 'foo',
      utm_campaign: 'hello',
    }
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams(searchParams),
      }
    )
    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.referrer === undefined)
    assert(ctx.event.context.campaign)
    assert(ctx.event.context.page?.search)
    expect(ctx.event.context.page.search).toEqual(searchParams)
    expect(ctx.event.context.campaign).toEqual({ name: 'hello', custom: 'foo' })
  })

  it('should not throw an error if the object is invalid', async () => {
    const searchParams = {
      invalidNested: {
        foo: {
          bar: null,
        },
      },
    }
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams(searchParams),
      }
    )
    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.referrer === undefined)
    expect(ctx.event.context.page?.search).toEqual(searchParams)
  })

  it('should add .referrer.id and .referrer.type (cookies)', async () => {
    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('?utm_source=source&urid=medium'),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.referrer)
    expect(ctx.event.context.referrer.id).toBe('medium')
    assert(ctx.event.context.referrer.type === 'millennial-media')
    expect(cookie.get('s:context.referrer')).toEqual(
      JSON.stringify({
        id: 'medium',
        type: 'millennial-media',
      })
    )
  })

  it('should add .referrer.id and .referrer.type (cookieless)', async () => {
    const setCookieSpy = jest.spyOn(cookie, 'set')
    analytics = new Analytics(
      { writeKey: options.apiKey },
      { disableClientPersistence: true }
    )

    await analytics.register(pageEnrichment)

    const ctx = await analytics.track(
      'test',
      {},
      {
        context: amendSearchParams('utm_source=source&urid=medium'),
      }
    )

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.referrer)
    expect(ctx.event.context.referrer.id).toEqual('medium')
    assert(ctx.event.context.referrer.type === 'millennial-media')
    expect(cookie.get('s:context.referrer')).toBeUndefined()
    expect(ignoreProbeCookieWrites(setCookieSpy).length).toBe(0)
  })

  it('should add .referrer.id and .referrer.type from cookie', async () => {
    cookie.set('s:context.referrer', '{"id":"baz","type":"millennial-media"}')
    const ctx = await analytics.track('test')

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.referrer)
    assert(ctx.event.context.referrer.id === 'baz')
    assert(ctx.event.context.referrer.type === 'millennial-media')
  })

  it('should add .referrer.id and .referrer.type from cookie when no query is given', async () => {
    cookie.set(
      's:context.referrer',
      '{"id":"medium","type":"millennial-media"}'
    )
    const ctx = await analytics.track('test')

    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.referrer)
    assert(ctx.event.context.referrer.id === 'medium')
    assert(ctx.event.context.referrer.type === 'millennial-media')
  })

  it('shouldnt add non amp ga cookie', async () => {
    cookie.set('_ga', 'some-nonamp-id')
    const ctx = await analytics.track('test')
    assert(ctx.event)
    assert(ctx.event.context)
    assert(!ctx.event.context.amp)
  })

  it('should add .amp.id from store', async () => {
    cookie.set('_ga', 'amp-foo')
    const ctx = await analytics.track('test')
    assert(ctx.event)
    assert(ctx.event.context)
    assert(ctx.event.context.amp)
    assert(ctx.event.context.amp.id === 'amp-foo')
  })

  it('should not add .amp if theres no _ga', async () => {
    cookie.remove('_ga')
    const ctx = await analytics.track('test')
    assert(ctx.event)
    assert(ctx.event.context)
    assert(!ctx.event.context.amp)
  })
})
