/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { EventQueue } from './core/queue/event-queue'
import { Context } from './core/context'
import { EventFactory, SegmentEvent } from './core/events'
import { invokeCallback } from './core/callback'
import { Extension } from './core/extension'
import { User, ID } from './core/user'
import { validation } from './extensions/validation'
import { ajsDestinations, LegacyIntegration } from './extensions/ajs-destination'
import { Emmitter } from './core/emmitter'

import { Track } from '@segment/facade/dist/track'
import { Identify } from '@segment/facade/dist/identify'
import { Page } from '@segment/facade/dist/page'

export interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  extensions?: Extension[]
}

type Callback = (ctx: Context | undefined) => Promise<unknown> | unknown

export class Analytics extends Emmitter {
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
    const remoteExtensions = await ajsDestinations(settings.writeKey)

    await analytics.register(...[validation, ...extensions, ...remoteExtensions])

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

  async track(event: string, properties?: object, options?: object, callback?: Callback): Promise<Context | undefined> {
    const segmentEvent = this.eventFactory.track(event, properties, options)
    this.emit('track', event, properties, options)

    this.emit(
      'invoke',
      // @ts-ignore
      new Track(segmentEvent)
    )
    return this.dispatch(segmentEvent, callback)
  }

  async page(page: string, properties?: object, options?: object, callback?: Callback): Promise<Context | undefined> {
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

  async identify(userId?: ID, traits?: object, options?: object, callback?: Callback): Promise<Context | undefined> {
    userId = this._user.id(userId)
    traits = this._user.traits(traits)

    const segmentEvent = this.eventFactory.identify(userId, traits, options)

    this.emit('identify', userId, traits, options)
    this.emit(
      'invoke',
      // @ts-ignore
      new Identify(segmentEvent)
    )
    return this.dispatch(segmentEvent, callback)
  }

  async register(...extensions: Extension[]): Promise<void> {
    const ctx = Context.system()

    const registrations = extensions.map((extension) => this.queue.register(ctx, extension, this))
    await Promise.all(registrations)

    ctx.logger.flush()
  }

  reset(): void {
    this._user.reset()
  }

  private async dispatch(event: SegmentEvent, callback?: Callback): Promise<Context | undefined> {
    const ctx = new Context(event)
    const dispatched = await this.queue.dispatch(ctx)
    return invokeCallback(dispatched, callback, this.settings.timeout)
  }
}
