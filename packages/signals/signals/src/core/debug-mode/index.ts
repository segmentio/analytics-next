/**
 * If query string is set, coerce to boolean
 * If query string is not set, return undefined
 */
export const parseDebugModeQueryString = (): boolean | undefined => {
  const queryParams = new URLSearchParams(window.location.search)

  const val =
    queryParams.get('segment_signals_debug') ||
    queryParams.get('seg_signals_debug')
  if (val === 'true' || val === 'false') {
    return val === 'true'
  }
  return undefined
}

export const parseDebugLoggingQueryString = (): boolean | undefined => {
  const queryParams = new URLSearchParams(window.location.search)

  const val =
    queryParams.get('segment_signals_logging') ||
    queryParams.get('seg_signals_logging')
  if (val === 'true' || val === 'false') {
    return val === 'true'
  }
  return undefined
}
