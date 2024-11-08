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

/**
 * This turns on advanced logging for signals!
 */
export type LogLevelOptions = 'info' | 'debug' | 'off' | undefined
export const parseSignalsLogLevel = (): LogLevelOptions => {
  const queryParams = new URLSearchParams(window.location.search)

  const val =
    queryParams.get('segment_signals_log_level') ||
    queryParams.get('seg_signals_log_level')
  if (val === 'info' || val === 'debug' || val === 'off') {
    return val
  } else if (typeof val === undefined) {
    return undefined
  } else {
    console.error(
      `Invalid signals_log_level: "${val}". Valid options are: info, debug, off`
    )
  }
}
