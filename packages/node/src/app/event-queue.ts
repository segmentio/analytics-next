import { EventQueue, PriorityQueue } from '@segment/analytics-core'
import type { Context } from './analytics-node'

class NodePriorityQueue extends PriorityQueue<Context> {
  constructor() {
    super(1, [])
  }
  // do not use an internal "seen" map
  getAttempts(ctx: Context): number {
    return ctx.attempts ?? 0
  }
  updateAttempts(ctx: Context): number {
    ctx.attempts = this.getAttempts(ctx) + 1
    return this.getAttempts(ctx)
  }
}

export class NodeEventQueue extends EventQueue {
  constructor() {
    super(new NodePriorityQueue())
  }
}
