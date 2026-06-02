const QUERY_PARAMS_SESSION_KEY = '__bg_analytics_query_params'

export function parseLocationSearchParams(
  search?: string
): Record<string, string> {
  const params: Record<string, string> = {}
  const raw =
    search ?? (typeof window !== 'undefined' ? window.location.search : '')
  if (!raw) {
    return params
  }

  const query = raw.startsWith('?') ? raw.slice(1) : raw
  const usp = new URLSearchParams(query)
  usp.forEach((value, key) => {
    params[key] = value
  })

  return params
}

export function getOrCaptureSessionQueryParams(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = window.sessionStorage.getItem(QUERY_PARAMS_SESSION_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>
      }
    }
  } catch {
    // fall through to capture
  }

  const captured = parseLocationSearchParams()
  try {
    window.sessionStorage.setItem(
      QUERY_PARAMS_SESSION_KEY,
      JSON.stringify(captured)
    )
  } catch {
    // sessionStorage unavailable
  }

  return captured
}
