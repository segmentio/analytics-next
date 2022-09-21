import { dispatch } from './dispatch'
import { CoreContext } from '../context'

/* Dispatch function, but swallow promise rejections and use event emitter instead */
export const dispatchAndEmit = async (
  ...[event, queue, emitter, options]: Parameters<typeof dispatch>
) => {
  try {
    const ctx = await dispatch(event, queue, emitter, options)
    if (ctx.failedDelivery()) {
      throw ctx
    } else {
      emitter.emit(event.type, ctx)
      return ctx
    }
  } catch (err) {
    emitter.emit('error', err as CoreContext)
    return err
  }
}
