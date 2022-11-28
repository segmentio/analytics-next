import { dispatch } from '@segment/analytics-core'
import type {
  CoreContext,
  CoreSegmentEvent,
  EventQueue,
} from '@segment/analytics-core'
import type { NodeEmitter } from './emitter'

export type Callback = (err?: unknown, ctx?: CoreContext) => void

const normalizeDispatchCb = (cb: Callback) => (ctx: CoreContext) => {
  const failedDelivery = ctx.failedDelivery()
  return failedDelivery ? cb(failedDelivery.reason, ctx) : cb(undefined, ctx)
}

/* Dispatch function, but swallow promise rejections and use event emitter instead */
export const dispatchAndEmit = async (
  event: CoreSegmentEvent,
  queue: EventQueue,
  emitter: NodeEmitter,
  callback?: Callback
): Promise<void> => {
  try {
    const ctx = await dispatch(event, queue, emitter, {
      ...(callback ? { callback: normalizeDispatchCb(callback) } : {}),
    })
    const failedDelivery = ctx.failedDelivery()
    if (failedDelivery) {
      emitter.emit('error', {
        code: 'delivery_failure',
        reason: failedDelivery.reason,
        ctx: ctx,
      })
    } else {
      emitter.emit(event.type, ctx)
    }
  } catch (err) {
    emitter.emit('error', {
      code: 'unknown',
      reason: err,
    })
  }
}
