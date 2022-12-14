import { CoreEventQueue, PriorityQueue } from '../src'

export class TestEventQueue extends CoreEventQueue {
  constructor() {
    super(new PriorityQueue(4, []))
  }
}
