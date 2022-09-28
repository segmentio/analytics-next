import { dispatch } from './dispatch'

/* Dispatch function, but swallow promise rejections and use event emitter instead */
export const dispatchAndEmit = async (
  ...[event, queue, emitter, options]: Parameters<typeof dispatch>
) => {
  try {
    const ctx = await dispatch(event, queue, emitter, options)
    if (ctx.failedDelivery()) {
      emitter.emit('error', {
        code: 'delivery_failure',
        message: 'failed to deliver event',
        ctx: ctx,
      })
    } else {
      emitter.emit(event.type, ctx)
      return ctx
    }
  } catch (err) {
    emitter.emit('error', {
      code: 'unknown',
      message: 'an unknown error occurred when dispatching an event.',
      err: err,
    })
  }
}
