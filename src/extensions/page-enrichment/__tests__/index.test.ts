import { Analytics } from '@/index'
import { pageEnrichment } from '../index'

let ajs: Analytics

describe('Page Enrichment', () => {
  beforeEach(async () => {
    ajs = await Analytics.load({
      writeKey: 'abc_123',
      extensions: [pageEnrichment],
    })
  })

  test('enriches page calls', async () => {
    await ajs.page('Checkout', {})
    const [ctx] = await ajs.queue.flush()

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
    await ajs.track('My event', {
      banana: 'phone',
    })

    const [ctx] = await ajs.queue.flush()

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
    await ajs.identify('Netto', {
      banana: 'phone',
    })

    const [ctx] = await ajs.queue.flush()

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
