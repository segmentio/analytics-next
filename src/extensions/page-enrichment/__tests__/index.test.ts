import { Analytics } from '@/index'

let ajs: Analytics

describe('Page Enrichment', () => {
  beforeEach(async () => {
    ajs = await Analytics.load({
      writeKey: 'abc_123',
    })
  })

  test('enriches page calls', async () => {
    const ctx = await ajs.page('Checkout', {})

    expect(ctx.event.properties).toMatchInlineSnapshot(`
      Object {
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

    expect(ctx.event.context).toMatchInlineSnapshot(`
      Object {
        "page": Object {
          "path": "/",
          "referrer": "",
          "search": "",
          "title": "",
          "url": "http://localhost/",
        },
      }
    `)
  })

  test('enriches identify events with the page context', async () => {
    const ctx = await ajs.identify('Netto', {
      banana: 'phone',
    })

    expect(ctx.event.context).toMatchInlineSnapshot(`
      Object {
        "page": Object {
          "path": "/",
          "referrer": "",
          "search": "",
          "title": "",
          "url": "http://localhost/",
        },
      }
    `)
  })
})
