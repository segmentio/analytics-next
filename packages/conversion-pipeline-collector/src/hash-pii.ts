import { createHash } from 'node:crypto'

const SHA256_HEX_RE = /^[a-f0-9]{64}$/i

export function isSha256Hex(value: string): boolean {
  return SHA256_HEX_RE.test(value.trim())
}

export function sha256Hex(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return ''
  }
  return createHash('sha256').update(normalized).digest('hex')
}

export function hashPiiField(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  if (isSha256Hex(value)) {
    return value.trim().toLowerCase()
  }
  return sha256Hex(value)
}
