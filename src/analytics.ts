import autoBind from './lib/bind-all'
import {
  AliasParams,
  DispatchedEvent,
  EventParams,
  PageParams,
  resolveAliasArguments,
  resolveArguments,
  resolvePageArguments,
  resolveUserArguments,
  UserParams,
} from './core/arguments-resolver'
import { Callback, invokeCallback } from './core/callback'
import { Context } from './core/context'
import { Emitter } from './core/emitter'
import { EventFactory, Integrations, SegmentEvent, Plan } from './core/events'
import { Extension } from './core/extension'
import { EventQueue } from './core/queue/event-queue'
import { CookieOptions, Group, ID, User, UserOptions } from './core/user'
import { LegacyDestination } from './extensions/ajs-destination'
import {
  MiddlewareFunction,
  sourceMiddlewareExtension,
} from './extensions/middleware'
import * as autoTrack from './core/auto-track'

export interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  extensions?: Extension[]
  [key: string]: unknown
}

export interface InitOptions {
  initialPageview?: boolean
  cookie?: CookieOptions
  user?: UserOptions
  group?: UserOptions
  integrations?: Integrations
  plan?: Plan
}

export class Analytics extends Emitter {
  queue: EventQueue
  private settings: AnalyticsSettings
  private _user: User
  private _group: Group
  private eventFactory: EventFactory
  private _debug = false
  integrations: Integrations

  constructor(
    settings: AnalyticsSettings,
    options?: InitOptions,
    queue?: EventQueue,
    user?: User,
    group?: Group
  ) {
    super()
    const cookieOptions = options?.cookie
    this.settings = settings
    this.queue = queue ?? new EventQueue()
    this._user = user ?? new User(options?.user, cookieOptions).load()
    this._group = group ?? new Group(options?.group, cookieOptions).load()
    this.eventFactory = new EventFactory(this._user)
    this.integrations = options?.integrations ?? {}
    autoBind(this)
  }

  user = (): User => {
    return this._user
  }

  async track(...args: EventParams): Promise<DispatchedEvent> {
    const [name, data, opts, cb] = resolveArguments(...args)

    const segmentEvent = this.eventFactory.track(
      name,
      data as SegmentEvent['properties'],
      opts,
      this.integrations
    )
    this.emit('track', name, data, opts)
    return this.dispatch(segmentEvent, cb)
  }

  async page(...args: PageParams): Promise<DispatchedEvent> {
    const [
      category,
      page,
      properties,
      options,
      callback,
    ] = resolvePageArguments(...args)

    const segmentEvent = this.eventFactory.page(
      category,
      page,
      properties,
      options,
      this.integrations
    )
    this.emit('page', category, name, properties, options)
    return this.dispatch(segmentEvent, callback)
  }

  async identify(...args: UserParams): Promise<DispatchedEvent> {
    const [id, _traits, options, callback] = resolveUserArguments(this._user)(
      ...args
    )

    this._user.identify(id, _traits)
    const segmentEvent = this.eventFactory.identify(
      this._user.id(),
      this._user.traits(),
      options,
      this.integrations
    )

    this.emit('identify', this._user.id(), this._user.traits(), options)
    return this.dispatch(segmentEvent, callback)
  }

  group(...args: UserParams): Promise<DispatchedEvent> | Group {
    if (args.length === 0) {
      return this._group
    }

    const [id, _traits, options, callback] = resolveUserArguments(this._group)(
      ...args
    )

    this._group.identify(id, _traits)
    const groupId = this._group.id()
    const groupdTraits = this._group.traits()

    const segmentEvent = this.eventFactory.group(
      groupId,
      groupdTraits,
      options,
      this.integrations
    )

    this.emit('group', groupId, groupdTraits, options)
    return this.dispatch(segmentEvent, callback)
  }

  async alias(...args: AliasParams): Promise<DispatchedEvent> {
    const [to, from, options, callback] = resolveAliasArguments(...args)
    const segmentEvent = this.eventFactory.alias(
      to,
      from,
      options,
      this.integrations
    )
    this.emit('alias', to, from, options)
    return this.dispatch(segmentEvent, callback)
  }

  async screen(...args: PageParams): Promise<DispatchedEvent> {
    const [
      category,
      page,
      properties,
      options,
      callback,
    ] = resolvePageArguments(...args)

    const segmentEvent = this.eventFactory.screen(
      category,
      page,
      properties,
      options,
      this.integrations
    )
    this.emit('screen', category, name, properties, options)
    return this.dispatch(segmentEvent, callback)
  }

  async trackClick(
    ...args: Parameters<typeof autoTrack.link>
  ): Promise<Analytics> {
    return autoTrack.link.call(this, ...args)
  }

  async trackLink(
    ...args: Parameters<typeof autoTrack.link>
  ): Promise<Analytics> {
    return autoTrack.link.call(this, ...args)
  }

  async trackSubmit(
    ...args: Parameters<typeof autoTrack.form>
  ): Promise<Analytics> {
    return autoTrack.form.call(this, ...args)
  }

  async trackForm(
    ...args: Parameters<typeof autoTrack.form>
  ): Promise<Analytics> {
    return autoTrack.form.call(this, ...args)
  }

  async register(...extensions: Extension[]): Promise<Context> {
    const ctx = Context.system()

    const registrations = extensions.map((xt) =>
      this.queue.register(ctx, xt, this)
    )
    await Promise.all(registrations)

    return ctx
  }

  debug(toggle: boolean): Analytics {
    this._debug = toggle
    return this
  }

  reset(): void {
    this._user.reset()
  }

  private async dispatch(
    event: SegmentEvent,
    callback?: Callback
  ): Promise<DispatchedEvent> {
    const ctx = new Context(event)
    const dispatched = await this.queue.dispatch(ctx)
    const result = await invokeCallback(
      dispatched,
      callback,
      this.settings.timeout
    )

    if (this._debug) {
      result.flush()
    }

    return result
  }

  addSourceMiddleware(fn: MiddlewareFunction): Analytics {
    const extension = sourceMiddlewareExtension(fn)
    this.register(extension).catch(console.error)
    return this
  }

  addDestinationMiddleware(
    integrationName: string,
    ...middlewares: MiddlewareFunction[]
  ): Analytics {
    const legacyDestinations = this.queue.extensions.filter(
      (xt) =>
        xt instanceof LegacyDestination &&
        xt.name.toLowerCase() === integrationName.toLowerCase()
    ) as LegacyDestination[]

    legacyDestinations.forEach((destination) =>
      destination.addMiddleware(...middlewares)
    )
    return this
  }

  setAnonymousId(id?: string): ID {
    return this._user.anonymousId(id)
  }

  /**
   * @deprecated This function does not register a destination extension.
   *
   * Instantiates a legacy Analytics.js destination.
   *
   * This function does not register the destination as an Analytics.JS extension,
   * all the it does it to invoke the factory function back.
   */
  use(pluginFactory: (analytics: Analytics) => void): Analytics {
    pluginFactory(this)
    return this
  }

  async ready(
    callback: Function = (res: Promise<unknown>[]): Promise<unknown>[] => res
  ): Promise<unknown> {
    return Promise.all(
      this.queue.extensions.map((i) =>
        i.ready ? i.ready() : Promise.resolve()
      )
    ).then((res) => {
      callback(res)
      return res
    })
  }
}
