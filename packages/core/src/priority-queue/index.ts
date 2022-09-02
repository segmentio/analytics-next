import { Emitter } from '../emitter'
import { backoff, calculateMaxTotalRetryTime } from './backoff'

/**
 * @internal
 */
export const ON_REMOVE_FROM_FUTURE = 'onRemoveFromFuture'

export interface QueueItem {
  id: string
}

export type Seen = {
  [id: string]: {
    /**
     * Number of retry attempts.
     */
    attempts: number
    /**
     *  Epoch time representing when this the current key/value is eligible for deletion.
     */
    expiration: number
  }
}

const _pruneExpiredFromSeenMap = (seen: Seen) => {
  // moving private methods outside outside of classes allows minification of those method names
  const now = Date.now()
  Object.entries(seen).forEach(([id, { expiration }]) => {
    if (now >= expiration) {
      delete seen[id]
    }
  })
}

export class PriorityQueue<T extends QueueItem> extends Emitter {
  protected future: T[] = []
  protected queue: T[]
  protected seen: Seen

  public maxAttempts: number

  constructor(maxAttempts: number, queue: T[], seen?: Seen) {
    super()
    this.maxAttempts = maxAttempts
    this.queue = queue
    this.seen = seen ?? {}
  }

  push(...operations: T[]): boolean[] {
    const accepted = operations.map((operation) => {
      const attempts = this.updateAttempts(operation)

      if (attempts > this.maxAttempts || this.includes(operation)) {
        return false
      }

      this.queue.push(operation)
      return true
    })

    this.queue = this.queue.sort(
      (a, b) => this.getAttempts(a) - this.getAttempts(b)
    )

    return accepted
  }

  pushWithBackoff(operation: T): boolean {
    if (this.getAttempts(operation) === 0) {
      return this.push(operation)[0]
    }

    const attempt = this.updateAttempts(operation)

    if (attempt > this.maxAttempts || this.includes(operation)) {
      return false
    }

    const timeout = backoff({ attempt: attempt - 1 })

    setTimeout(() => {
      this.queue.push(operation)
      // remove from future list
      this.future = this.future.filter((f) => f.id !== operation.id)
      // Lets listeners know that a 'future' message is now available in the queue
      this.emit(ON_REMOVE_FROM_FUTURE)
    }, timeout)

    this.future.push(operation)
    return true
  }

  getAttempts(operation: T): number {
    return this.seen[operation.id]?.attempts ?? 0
  }

  updateAttempts(operation: T): number {
    _pruneExpiredFromSeenMap(this.seen)
    const attempts = this.getAttempts(operation) + 1
    this.seen[operation.id] = {
      attempts: attempts,
      expiration: Date.now() + calculateMaxTotalRetryTime(this.maxAttempts),
    }
    return attempts
  }

  includes(operation: T): boolean {
    return (
      this.queue.includes(operation) ||
      this.future.includes(operation) ||
      Boolean(this.queue.find((i) => i.id === operation.id)) ||
      Boolean(this.future.find((i) => i.id === operation.id))
    )
  }

  pop(): T | undefined {
    _pruneExpiredFromSeenMap(this.seen)
    return this.queue.shift()
  }

  get length(): number {
    return this.queue.length
  }

  get todo(): number {
    return this.queue.length + this.future.length
  }
}
