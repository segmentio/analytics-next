import { EventQueue } from './queue/event-queue'
import { Context } from './context'
import { EventFactory, SegmentEvent } from './events'
import { invokeCallback } from './callback'
import { Extension } from './extension'
import { User, ID } from './user'
import { validation } from '../extensions/validation'
import { segment } from '../extensions/segment'
import { ajsDestinations } from '../extensions/ajs-destination'

export interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  extensions?: Extension[]
}

type Callback = (ctx: Context | undefined) => Promise<unknown> | unknown

export class Analytics {
  queue: EventQueue
  settings: AnalyticsSettings
  private _user: User
  private eventFactory: EventFactory

  private constructor(settings: AnalyticsSettings, queue: EventQueue, user: User) {
    this.settings = settings
    this.queue = queue
    this._user = user
    this.eventFactory = new EventFactory(user)
  }

  static async load(settings: AnalyticsSettings): Promise<Analytics> {
    const queue = new EventQueue()

    const user = new User().load()
    const analytics = new Analytics(settings, queue, user)

    await analytics.register(validation)

    // TODO: make loadScript work in test
    if (process.env.NODE_ENV !== 'test') {
      await analytics.register(
        segment({
          apiKey: settings.writeKey,
        })
      )
    }

    await analytics.register(...(settings.extensions ?? []))
    const remoteExtensions = await ajsDestinations(settings.writeKey)
    await analytics.register(...remoteExtensions)

    return analytics
  }

  user(): User {
    return this._user
  }

  async track(event: string, properties?: object, options?: object, callback?: Callback): Promise<Context | undefined> {
    const segmentEvent = this.eventFactory.track(event, properties, options)
    return this.dispatch(segmentEvent, callback)
  }

  async page(page: string, properties?: object, options?: object, callback?: Callback): Promise<Context | undefined> {
    const segmentEvent = this.eventFactory.page(page, properties, options)
    return this.dispatch(segmentEvent, callback)
  }

  async identify(userId?: ID, traits?: object, options?: object, callback?: Callback): Promise<Context | undefined> {
    userId = this._user.id(userId)
    traits = this._user.traits(traits)

    const segmentEvent = this.eventFactory.identify(userId, traits, options)
    return this.dispatch(segmentEvent, callback)
  }

  async register(...extensions: Extension[]): Promise<void> {
    const registrations = extensions.map((extension) => this.queue.register(extension, this))
    await Promise.all(registrations)
  }

  // TODO: Add emitter
  on(): void {
    // todo
  }

  ready(): void {
    // TODO: on ready
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
