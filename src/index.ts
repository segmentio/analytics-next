/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Group } from '@segment/facade/dist/group'
import { Identify } from '@segment/facade/dist/identify'
import { Page } from '@segment/facade/dist/page'
import { Track } from '@segment/facade/dist/track'
import { DispatchedEvent, EventParams, resolveArguments, resolveUserArguments, UserParams } from './core/arguments-resolver'
import { Callback, invokeCallback } from './core/callback'
import { Context } from './core/context'
import { Emitter } from './core/emitter'
import { EventFactory, SegmentEvent } from './core/events'
import { Extension } from './core/extension'
import { EventQueue } from './core/queue/event-queue'
import { ID, User } from './core/user'
import { ajsDestinations } from './extensions/ajs-destination'
import { pageEnrichment } from './extensions/page-enrichment'
import { validation } from './extensions/validation'

export interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  extensions?: Extension[]
}

export class Analytics extends Emitter {
  queue: EventQueue
  settings: AnalyticsSettings
  private _user: User
  private eventFactory: EventFactory

  private constructor(settings: AnalyticsSettings, queue: EventQueue, user: User) {
    super()
    this.settings = settings
    this.queue = queue
    this._user = user
    this.eventFactory = new EventFactory(user)
  }

  static async load(settings: AnalyticsSettings): Promise<Analytics> {
    const queue = new EventQueue()

    const user = new User().load()
    const analytics = new Analytics(settings, queue, user)

    const extensions = settings.extensions ?? []
    const remoteExtensions = process.env.NODE_ENV !== 'test' ? await ajsDestinations(settings.writeKey) : []
    await analytics.register(...[validation, pageEnrichment, ...extensions, ...remoteExtensions])

    analytics.emit(
      'initialize',
      settings,
      // TODO: options
      {}
    )

    return analytics
  }

  user(): User {
    return this._user
  }

  async track(...args: EventParams): DispatchedEvent {
    const [name, data, opts, cb] = resolveArguments(...args)

    const segmentEvent = this.eventFactory.track(name, data, opts)
    this.emit('track', name, data, opts)

    this.emit(
      'invoke',
      // @ts-ignore
      new Track(segmentEvent)
    )
    return this.dispatch(segmentEvent, cb)
  }

  async page(...args: EventParams): DispatchedEvent {
    const [page, properties, options, callback] = resolveArguments(...args)

    const segmentEvent = this.eventFactory.page(page, properties, options)
    this.emit(
      'page',
      // TODO: category
      null,
      name,
      properties,
      options
    )

    this.emit(
      'invoke',
      // @ts-ignore
      new Page(segmentEvent)
    )
    return this.dispatch(segmentEvent, callback)
  }

  async identify(...args: UserParams): DispatchedEvent {
    const [id, _traits, options, callback] = resolveUserArguments(this._user)(...args)

    this._user.identify(id, _traits)
    const segmentEvent = this.eventFactory.identify(this._user.id(), this._user.traits(), options)

    this.emit('identify', this._user.id(), this._user.traits(), options)
    this.emit(
      'invoke',
      // @ts-ignore
      new Identify(segmentEvent)
    )
    return this.dispatch(segmentEvent, callback)
  }

  async group(...args: UserParams): DispatchedEvent {
    const [id, _traits, options, callback] = resolveUserArguments(this._user)(...args)

    this._user.identify(id, _traits)
    const segmentEvent = this.eventFactory.group(this._user.id(), this._user.traits(), options)

    this.emit('group', this._user.id(), this._user.traits(), options)
    this.emit(
      'invoke',
      // @ts-ignore
      new Group(segmentEvent)
    )
    return this.dispatch(segmentEvent, callback)
  }

  // TODO: alias

  async register(...extensions: Extension[]): Promise<void> {
    const ctx = Context.system()

    const registrations = extensions.map((xt) => this.queue.register(ctx, xt, this))
    await Promise.all(registrations)

    ctx.logger.flush()
  }

  reset(): void {
    this._user.reset()
  }

  private async dispatch(event: SegmentEvent, callback?: Callback): DispatchedEvent {
    const ctx = new Context(event)
    const dispatched = await this.queue.dispatch(ctx)
    return invokeCallback(dispatched, callback, this.settings.timeout)
  }
}
