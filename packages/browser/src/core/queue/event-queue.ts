import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { Context } from '../context'
import { Plugin } from '../plugin'
import { CoreEventQueue } from '@segment/analytics-core'
import { isOffline } from '../connection'

export class EventQueue extends CoreEventQueue<Context, Plugin> {
  constructor(name: string)
  constructor(priorityQueue: PriorityQueue<Context>)
  constructor(nameOrQueue: string | PriorityQueue<Context>) {
    super(
      typeof nameOrQueue === 'string'
        ? new PersistedPriorityQueue(4, nameOrQueue)
        : nameOrQueue
    )
  }
  async flush(): Promise<Context[]> {
    if (isOffline()) return []
    return super.flush()
  }
}
