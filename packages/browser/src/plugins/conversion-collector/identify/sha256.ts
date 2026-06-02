const SHA256_HEX_RE = /^[a-f0-9]{64}$/i

export function isSha256Hex(value: string): boolean {
  return SHA256_HEX_RE.test(value.trim())
}

export async function sha256Hex(value: string): Promise<string> {
  const normalized = value.trim()
  if (!normalized) {
    return ''
  }

  if (typeof crypto === 'undefined' || !crypto.subtle?.digest) {
    throw new Error('SHA-256 is not available in this environment')
  }

  const data = new TextEncoder().encode(normalized)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
