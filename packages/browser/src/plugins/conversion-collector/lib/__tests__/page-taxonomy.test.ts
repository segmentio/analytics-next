import { parsePathTaxonomy } from '../page-taxonomy'

describe('parsePathTaxonomy', () => {
  it('parses four-part path segments', () => {
    expect(parsePathTaxonomy('/usa-cc-mastercardbuilt-p1')).toEqual({
      country: 'usa',
      vertical: 'cc',
      product: 'mastercardbuilt',
      funnel: 'p1',
    })
  })

  it('joins middle segments into product when there are more than four parts', () => {
    expect(parsePathTaxonomy('/usa-cc-master-card-built-p1')).toEqual({
      country: 'usa',
      vertical: 'cc',
      product: 'master-card-built',
      funnel: 'p1',
    })
  })

  it('returns empty taxonomy when the first segment does not match', () => {
    expect(parsePathTaxonomy('/quiz')).toEqual({
      country: '',
      vertical: '',
      product: '',
      funnel: '',
    })
  })
})
