import { v4 as uuid } from '@lukeed/uuid'
import { CoreContext, CoreSegmentEvent } from '@segment/analytics-core'

const MAX_EVENT_SIZE_IN_BYTES = 32 * 1024 // 32 KB
const MAX_BATCH_SIZE_IN_BYTES = 480 * 1024 // 480 KB (500 KB is the limit, leaving some padding)

interface PendingItem {
  resolver: (ctx: CoreContext) => void
  context: CoreContext
}

export class ContextBatch {
  public id = uuid()
  private items: PendingItem[] = []
  private sizeInBytes = 0
  private maxEventCount: number

  constructor(maxEventCount: number) {
    this.maxEventCount = Math.max(1, maxEventCount)
  }
  public tryAdd(item: PendingItem) {
    if (this.length === this.maxEventCount) return false

    const eventSize = this.calculateSize(item.context)
    if (eventSize > MAX_EVENT_SIZE_IN_BYTES) {
      // Event exceeds Segment's limits
      return false
    }
    if (this.sizeInBytes + eventSize <= MAX_BATCH_SIZE_IN_BYTES) {
      this.items.push(item)
      this.sizeInBytes += eventSize
      return true
    }
    return false
  }

  get length(): number {
    return this.items.length
  }

  private calculateSize(ctx: CoreContext): number {
    return encodeURI(JSON.stringify(ctx.event)).split(/%..|i/).length
  }

  getEvents(): CoreSegmentEvent[] {
    const events = this.items.map(({ context }) => context.event)
    return events
  }

  getContexts(): CoreContext[] {
    return this.items.map((item) => item.context)
  }

  resolveEvents(): void {
    this.items.forEach(({ resolver, context }) => resolver(context))
  }
}
