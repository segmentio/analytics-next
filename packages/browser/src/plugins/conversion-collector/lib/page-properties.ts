import { applyQueryParamsToProperties } from './apply-query-params'
import { getOrCaptureSessionQueryParams } from './query-params'
import { getPagePath, parsePathTaxonomy } from './page-taxonomy'
import { resolveVisitorCountry } from './visitor-country'
import type { ConversionCollectorSettings } from '../types'

export async function buildPageEventProperties(
  config: ConversionCollectorSettings,
  userProperties: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const queryParams = getOrCaptureSessionQueryParams()
  const taxonomy = parsePathTaxonomy(getPagePath())
  const visitorCountry = await resolveVisitorCountry(config)

  return applyQueryParamsToProperties(
    {
      ...userProperties,
      page_path: getPagePath(),
      visitor_country: visitorCountry,
      country: taxonomy.country,
      vertical: taxonomy.vertical,
      product: taxonomy.product,
      funnel: taxonomy.funnel,
    },
    queryParams
  )
}

export function enrichWithSessionQueryParams(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const queryParams = getOrCaptureSessionQueryParams()
  return applyQueryParamsToProperties(properties, queryParams)
}
