import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { Context } from '../context'
import { AnyBrowserPlugin } from '../plugin'
import { CoreEventQueue } from '@segment/analytics-core'
import { isOffline } from '../connection'

export class EventQueue extends CoreEventQueue<Context, AnyBrowserPlugin> {
  constructor(writeKey: string)
  constructor(priorityQueue: PriorityQueue<Context>)
  constructor(writeKeyOrQueue: string | PriorityQueue<Context>) {
    super(
      typeof writeKeyOrQueue === 'string'
        ? new PersistedPriorityQueue(4, 'event-queue', writeKeyOrQueue)
        : writeKeyOrQueue
    )
  }
  async flush(): Promise<Context[]> {
    if (isOffline()) return []
    return super.flush()
  }
}
