import { PriorityQueue, Seen } from '.'
import { CoreContext, SerializedContext } from '../context'

const nullStorage = (): Storage => ({
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
  length: 0,
  clear: () => null,
  key: () => null,
})

function persisted(loc: Storage, key: string): CoreContext[] {
  const items = loc.getItem(key)
  return (items ? JSON.parse(items) : []).map(
    (p: SerializedContext) => new CoreContext(p.event, p.id)
  )
}

function persistItems(loc: Storage, key: string, items: CoreContext[]): void {
  const existing = persisted(loc, key)
  const all = [...items, ...existing]

  const merged = all.reduce((acc, item) => {
    return {
      ...acc,
      [item.id]: item,
    }
  }, {} as Record<string, CoreContext>)

  loc.setItem(key, JSON.stringify(Object.values(merged)))
}

function seen(loc: Storage, key: string): Seen {
  const stored = loc.getItem(key)
  return stored ? JSON.parse(stored) : {}
}

function persistSeen(loc: Storage, key: string, memory: Seen): void {
  const stored = seen(loc, key)

  loc.setItem(
    key,
    JSON.stringify({
      ...stored,
      ...memory,
    })
  )
}

function remove(loc: Storage, key: string): void {
  loc.removeItem(key)
}

const now = (): number => new Date().getTime()

function mutex(
  loc: Storage,
  key: string,
  onUnlock: Function,
  attempt = 0
): void {
  const lockTimeout = 50
  const lockKey = `persisted-queue:v1:${key}:lock`

  const expired = (lock: number): boolean => new Date().getTime() > lock
  const rawLock = loc.getItem(lockKey)
  const lock = rawLock ? (JSON.parse(rawLock) as number) : null

  const allowed = lock === null || expired(lock)
  if (allowed) {
    loc.setItem(lockKey, JSON.stringify(now() + lockTimeout))
    onUnlock()
    loc.removeItem(lockKey)
    return
  }

  if (!allowed && attempt < 3) {
    setTimeout(() => {
      mutex(loc, key, onUnlock, attempt + 1)
    }, lockTimeout)
  } else {
    console.error('Unable to retrieve lock')
  }
}

export class PersistedPriorityQueue extends PriorityQueue<CoreContext> {
  loc: Storage
  constructor(maxAttempts: number, key: string) {
    super(maxAttempts, [])

    if (typeof window === undefined) {
      throw new Error('must be run in browser.')
    }

    this.loc = window.localStorage ? window.localStorage : nullStorage()

    const itemsKey = `persisted-queue:v1:${key}:items`
    const seenKey = `persisted-queue:v1:${key}:seen`

    let saved: CoreContext[] = []
    let lastSeen: Seen = {}

    mutex(this.loc, key, () => {
      try {
        saved = persisted(this.loc, itemsKey)
        lastSeen = seen(this.loc, seenKey)
        remove(this.loc, itemsKey)
        remove(this.loc, seenKey)

        this.queue = [...saved, ...this.queue]
        this.seen = { ...lastSeen, ...this.seen }
      } catch (err) {
        console.error(err)
      }
    })

    window.addEventListener('beforeunload', () => {
      if (this.todo > 0) {
        const items = [...this.queue, ...this.future]
        try {
          mutex(this.loc, key, () => {
            persistItems(this.loc, itemsKey, items)
            persistSeen(this.loc, seenKey, this.seen)
          })
        } catch (err) {
          console.error(err)
        }
      }
    })
  }
}
