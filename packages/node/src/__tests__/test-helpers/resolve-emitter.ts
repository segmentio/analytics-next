import { NodeEmitter, NodeEmitterEvents } from '../../app/emitter'

/** Tester helper that resolves args from emitter event */
export const resolveEmitterEvent = <EventName extends keyof NodeEmitterEvents>(
  emitter: NodeEmitter,
  eventName: EventName
): Promise<NodeEmitterEvents[EventName]> => {
  return new Promise<NodeEmitterEvents[EventName]>((resolve) => {
    emitter.once(eventName, (...args) => resolve(args))
  })
}
