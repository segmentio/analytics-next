import { CoreContext } from '../context'
import { CoreSegmentEvent, Callback } from '../events/interfaces'
import { EventQueue } from '../queue/event-queue'
import { isOffline } from '../connection'
import { invokeCallback } from '../callback'
import { Emitter } from '../emitter'

export type DispatchOptions = {
  timeout?: number
  debug?: boolean
  callback?: Callback
  retryQueue?: boolean
}

/* The amount of time in ms to wait before invoking the callback. */
export const getDelay = (startTimeInEpochMS: number, timeoutInMS?: number) => {
  const elapsedTime = Date.now() - startTimeInEpochMS
  // increasing the timeout increases the delay by almost the same amount -- this is weird legacy behavior.
  return Math.max((timeoutInMS ?? 300) - elapsedTime, 0)
}
/**
 * Push an event into the dispatch queue and invoke any callbacks.
 *
 * @param event - Segment event to enqueue.
 * @param queue - Queue to dispatch against.
 * @param emitter - This is typically an instance of "Analytics" -- used for metrics / progress information.
 * @param options
 */
export async function dispatch(
  event: CoreSegmentEvent,
  queue: EventQueue,
  emitter: Emitter,
  options?: DispatchOptions
): Promise<CoreContext> {
  const ctx = new CoreContext(event)
  emitter.emit('dispatch_pending', ctx) // This is just for inspector host
  // TODO: inspectorHost.triggered?.(ctx as any)

  if (isOffline() && !options?.retryQueue) {
    return ctx
  }

  const startTime = Date.now()
  let dispatched: CoreContext
  if (queue.isEmpty()) {
    dispatched = await queue.dispatchSingle(ctx)
  } else {
    dispatched = await queue.dispatch(ctx)
  }

  if (options?.callback) {
    dispatched = await invokeCallback(
      dispatched,
      options.callback,
      getDelay(startTime, options.timeout)
    )
  }
  if (options?.debug) {
    dispatched.flush()
  }

  return dispatched
}
