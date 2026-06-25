import { Context } from '../../../../core/context'
import { clickIdEnrichment } from '../click-id-enrichment'

function enrichSearch(search: string): Record<string, unknown> | undefined {
  const plugin = clickIdEnrichment()
  const ctx = new Context({
    type: 'track',
    event: 'click_ids',
    context: { page: { search } },
  })

  const enriched = plugin.track?.(ctx) as Context
  return enriched.event.context?.campaign as Record<string, unknown> | undefined
}

describe('clickIdEnrichment', () => {
  it('captures all supported click IDs into context.campaign', () => {
    const campaign = enrichSearch(
      '?gclid=g&fbclid=fb&ttclid=tt&msclkid=ms&twclid=tw'
    )

    expect(campaign).toMatchObject({
      gclid: 'g',
      fbclid: 'fb',
      ttclid: 'tt',
      msclkid: 'ms',
      twclid: 'tw',
    })
  })

  it('normalizes tt_clid into ttclid', () => {
    expect(enrichSearch('?tt_clid=tt_alias')).toMatchObject({
      ttclid: 'tt_alias',
    })
  })
})
