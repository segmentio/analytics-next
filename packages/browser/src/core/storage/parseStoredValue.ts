/**
 * Parses a stored value as JSON, falling back to the raw string.
 *
 * A number is only accepted if it prints back to exactly what was stored.
 * Otherwise JSON.parse would silently corrupt string ids that merely look
 * numeric (e.g. "7689174720735493772" > Number.MAX_SAFE_INTEGER becomes
 * 7689174720735494000, "1e3" becomes 1000), so the raw string is returned.
 */
export function parseStoredValue(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw) ?? null
    return typeof parsed === 'number' && String(parsed) !== raw ? raw : parsed
  } catch {
    return raw
  }
}
