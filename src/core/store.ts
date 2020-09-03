// TODO: allow for different stores

export class EventStore {
  queue: object[]

  constructor() {
    this.queue = []
  }

  async dispatch(event: object): Promise<object> {
    this.queue.push(event)
    return Promise.resolve(event)
  }
}
