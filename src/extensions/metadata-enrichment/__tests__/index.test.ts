import { Analytics } from '../../../analytics'
import { metadataEnrichment } from '..'

let ajs: Analytics

describe('Metadata Enrichment', () => {
  beforeEach(async () => {
    ajs = new Analytics({
      writeKey: 'abc_123',
    })

    await ajs.register(
      metadataEnrichment(
        {
          integrations: {
            foo: {
              bundlingStatus: 'bundled',
            },
            bar: {
              bundlingStatus: 'unbundled',
            },
            baz: {
              bundlingStatus: undefined,
            },
          },
        },
        ['failed']
      )
    )
  })

  test('enriches track call', async () => {
    const ctx = await ajs.track('Checkout', {})

    expect(ctx.event._metadata).toMatchInlineSnapshot(`
      Object {
        "bundled": Array [
          "foo",
        ],
        "failedInitializations": Array [
          "failed",
        ],
        "unbundledIntegrations": Array [
          "bar",
        ],
      }
    `)
  })
})
