/** Keys promoted to top-level `properties` (also kept inside `query_params`). */
export const DEDICATED_QUERY_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'tt_clid',
  'ttclid',
  'msclkid',
  'twclid',
  'to',
  'p',
  'ref',
] as const

export function spreadDedicatedQueryParams(
  queryParams: Record<string, string>
): Record<string, string> {
  const dedicated: Record<string, string> = {}

  for (const key of DEDICATED_QUERY_PARAM_KEYS) {
    const value = queryParams[key]
    if (value !== undefined && value !== '') {
      dedicated[key] = value
    }
  }

  return dedicated
}
