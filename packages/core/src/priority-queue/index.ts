import { CoreContext } from '../context'
import { Emitter } from '../emitter'
import { backoff } from './backoff'

/**
 * @internal
 */
export const ON_REMOVE_FROM_FUTURE = 'onRemoveFromFuture'

export interface WithID {
  id: string
}

export class PriorityQueue<
  Context extends WithID = CoreContext
> extends Emitter {
  protected future: Context[] = []
  protected queue: Context[]
  protected seen: Record<string, number>

  public maxAttempts: number

  constructor(
    maxAttempts: number,
    queue: Context[],
    seen?: Record<string, number>
  ) {
    super()
    this.maxAttempts = maxAttempts
    this.queue = queue
    this.seen = seen ?? {}
  }

  push(...ctx: Context[]): boolean[] {
    const accepted = ctx.map((operation) => {
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

  pushWithBackoff(ctx: Context): boolean {
    if (this.getAttempts(ctx) === 0) {
      return this.push(ctx)[0]
    }

    const attempt = this.updateAttempts(ctx)

    if (attempt > this.maxAttempts || this.includes(ctx)) {
      return false
    }

    const timeout = backoff({ attempt: attempt - 1 })

    setTimeout(() => {
      this.queue.push(ctx)
      // remove from future list
      this.future = this.future.filter((f) => f.id !== ctx.id)
      // Lets listeners know that a 'future' message is now available in the queue
      this.emit(ON_REMOVE_FROM_FUTURE)
    }, timeout)

    this.future.push(ctx)
    return true
  }

  public getAttempts(ctx: Context): number {
    return this.seen[ctx.id] ?? 0
  }

  public updateAttempts(ctx: Context): number {
    this.seen[ctx.id] = this.getAttempts(ctx) + 1
    return this.getAttempts(ctx)
  }

  includes(ctx: Context): boolean {
    return (
      this.queue.includes(ctx) ||
      this.future.includes(ctx) ||
      Boolean(this.queue.find((i) => i.id === ctx.id)) ||
      Boolean(this.future.find((i) => i.id === ctx.id))
    )
  }

  pop(): Context | undefined {
    return this.queue.shift()
  }

  public get length(): number {
    return this.queue.length
  }

  public get todo(): number {
    return this.queue.length + this.future.length
  }
}
