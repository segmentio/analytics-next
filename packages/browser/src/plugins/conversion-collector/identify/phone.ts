/** Normalizes phone to E.164 (e.g. `+5511987654321`). */
export function normalizePhoneToE164(
  phone: string,
  defaultCountryCode = '55'
): string {
  const trimmed = phone.trim()
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '')
    return digits ? `+${digits}` : ''
  }

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  if (digits.startsWith(defaultCountryCode)) {
    return `+${digits}`
  }

  if (
    defaultCountryCode === '55' &&
    (digits.length === 10 || digits.length === 11)
  ) {
    return `+55${digits}`
  }

  return `+${digits}`
}
