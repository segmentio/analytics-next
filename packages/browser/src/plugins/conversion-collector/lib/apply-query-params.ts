import { spreadDedicatedQueryParams } from './query-params-dedicated'

export function applyQueryParamsToProperties(
  properties: Record<string, unknown>,
  queryParams: Record<string, string>
): Record<string, unknown> {
  if (Object.keys(queryParams).length === 0) {
    return properties
  }

  return {
    ...properties,
    ...spreadDedicatedQueryParams(queryParams),
    query_params: queryParams,
  }
}
