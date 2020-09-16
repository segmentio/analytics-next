import { EventQueue } from './queue/event-queue'
import { validate } from './validation'
import { Context } from './context'
import { SegmentEvent } from './events'
import { invokeCallback } from './callback'
import { Extension } from './extension'

interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  extensions?: Extension[]
  deliverInline?: boolean
  // TODO:
  // - custom url endpoint
  // - integrations object
  // - extensions
  // - reset
  // - events
  // - event level middleware
}
type Callback = (ctx: Context | undefined) => Promise<unknown> | unknown

export class Analytics {
  queue: EventQueue
  settings: AnalyticsSettings

  constructor(settings: AnalyticsSettings) {
    this.queue = new EventQueue({
      extensions: settings.extensions ?? [],
      inline: settings.deliverInline,
    })

    this.settings = settings
  }

  // TODO/ideas
  // - user id capture
  // - meta timestamps
  // - add callback as part of dispatch

  async track(
    event: string,
    properties?: object,
    _options?: object,
    callback?: Callback
  ): Promise<Context | undefined> {
    const segmentEvent: SegmentEvent = {
      event,
      type: 'track' as const,
      properties,
    }

    return this.dispatch('track', segmentEvent, callback)
  }

  async identify(
    userId?: string,
    traits?: object,
    _options?: object,
    callback?: Callback
  ): Promise<Context | undefined> {
    // todo: grab traits from user
    // todo: grab id from user

    const segmentEvent = {
      type: 'identify' as const,
      userId,
      traits,
    }

    return this.dispatch('identify', segmentEvent, callback)
  }

  // TODO: Add emitter

  ready(): void {
    // TODO: on ready
  }

  reset(): void {
    // TODO: reset user
  }

  private async dispatch(type: string, event: SegmentEvent, callback?: Callback): Promise<Context | undefined> {
    const ctx = new Context(event)
    validate(type, event.properties ?? event.traits ?? {})

    const dispatched = await this.queue.dispatch(ctx)
    return invokeCallback(dispatched, callback, this.settings.timeout)
  }
}
