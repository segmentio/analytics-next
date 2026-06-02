/** RFC 4122 UUID v4 (variant 1, version 4). */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value)
}

export function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  const getRandomValues = (
    globalThis as typeof globalThis & {
      crypto?: { getRandomValues?: (array: Uint8Array) => Uint8Array }
    }
  ).crypto?.getRandomValues

  if (getRandomValues) {
    getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
