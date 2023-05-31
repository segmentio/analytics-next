export interface PersistedQueueResult {
  key: string
  name: string
  messageIds: string[]
  writeKey?: string
}

export function getPersistedItems(): PersistedQueueResult[] {
  const results: PersistedQueueResult[] = []

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (
      key &&
      key.startsWith('persisted-queue:v1:') &&
      key.endsWith(':items')
    ) {
      const value = window.localStorage.getItem(key)
      const messageIds = value
        ? JSON.parse(value).map((i: any) => i.event.messageId)
        : []

      // Key looks like either:
      // new keys - persisted-queue:v1:writeKey:dest-Segment.io:items
      // old keys - persisted-queue:v1:dest-Segment.io:items
      const components = key.split(':')
      let writeKey: string | undefined
      let name: string

      if (components.length === 5) {
        ;[, , writeKey, name] = components
      } else if (components.length === 4) {
        ;[, , name] = components
      } else {
        throw new Error('Unrecognized persisted queue key.')
      }
      results.push({ key, messageIds, name, writeKey })
    }
  }

  return results
}
