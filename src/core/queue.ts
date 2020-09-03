import { Context } from './context'

export class EventQueue {
  queue: Context[]

  constructor() {
    this.queue = []
  }

  async dispatch(ctx: Context): Promise<Context> {
    ctx.log('debug', 'Dispatching', { messageId: ctx.messageId })

    this.queue.push(ctx)
    return Promise.resolve(ctx)
  }
}
