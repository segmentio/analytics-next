import { CoreContext } from '../context'
import { CoreSegmentEvent, Callback } from '../events/interfaces'
import { EventQueue } from '../queue/event-queue'
import { isOffline } from '../connection'
import { Emitter } from '../emitter'
import { invokeCallback } from '../callback'

type DispatchOptions = {
  timeout?: number
  debug?: boolean
  callback?: Callback
  retryQueue?: boolean
}

/* The amount of time in ms to wait before invoking the callback. */
export const getDelayTimeout = (
  startTimeInEpochMS: number,
  timeoutInMS?: number
) => {
  const elapsedTime = Date.now() - startTimeInEpochMS
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
  emitter.emit('message_dispatch_pending', ctx) // TODO: inspectorHost.triggered?.(ctx as any)

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
      getDelayTimeout(startTime, options.timeout),
      options.timeout
    )
  }
  if (options?.debug) {
    dispatched.flush()
  }

  return dispatched
}
