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
import { Plugin } from './core/plugin'
import { EventQueue } from './core/queue/event-queue'
import { CookieOptions, Group, ID, User, UserOptions } from './core/user'
import type { MiddlewareFunction } from './plugins/middleware'
import type { LegacyDestination } from './plugins/ajs-destination'
import type { FormArgs, LinkArgs } from './core/auto-track'
import { AnalyticsBrowser } from './browser'
import { PersistedPriorityQueue } from './lib/priority-queue/persisted'
import { isOffline } from './core/connection'

const deprecationWarning =
  'This is being deprecated and will be not be available in future releases of Analytics JS'

// reference any pre-existing "analytics" object so a user can restore the reference
const globalAny: any = global
const _analytics = globalAny.analytics

export interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  plugins?: Plugin[]
  [key: string]: unknown
}

export interface InitOptions {
  initialPageview?: boolean
  cookie?: CookieOptions
  user?: UserOptions
  group?: UserOptions
  integrations?: Integrations
  plan?: Plan
  retryQueue?: boolean
}

export class Analytics extends Emitter {
  protected settings: AnalyticsSettings
  private _user: User
  private _group: Group
  private eventFactory: EventFactory
  private _debug = false
  initialized = false
  integrations: Integrations
  options: InitOptions
  queue: EventQueue

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
    this.settings.timeout = this.settings.timeout ?? 300
    this.queue =
      queue ??
      new EventQueue(
        new PersistedPriorityQueue(options?.retryQueue ? 4 : 1, 'event-queue')
      )
    this._user = user ?? new User(options?.user, cookieOptions).load()
    this._group = group ?? new Group(options?.group, cookieOptions).load()
    this.eventFactory = new EventFactory(this._user)
    this.integrations = options?.integrations ?? {}
    this.options = options ?? {}
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

  async trackClick(...args: LinkArgs): Promise<Analytics> {
    const autotrack = await import(
      /* webpackChunkName: "auto-track" */ './core/auto-track'
    )
    return autotrack.link.call(this, ...args)
  }

  async trackLink(...args: LinkArgs): Promise<Analytics> {
    const autotrack = await import(
      /* webpackChunkName: "auto-track" */ './core/auto-track'
    )
    return autotrack.link.call(this, ...args)
  }

  async trackSubmit(...args: FormArgs): Promise<Analytics> {
    const autotrack = await import(
      /* webpackChunkName: "auto-track" */ './core/auto-track'
    )
    return autotrack.form.call(this, ...args)
  }

  async trackForm(...args: FormArgs): Promise<Analytics> {
    const autotrack = await import(
      /* webpackChunkName: "auto-track" */ './core/auto-track'
    )
    return autotrack.form.call(this, ...args)
  }

  async register(...plugins: Plugin[]): Promise<Context> {
    const ctx = Context.system()

    const registrations = plugins.map((xt) =>
      this.queue.register(ctx, xt, this)
    )
    await Promise.all(registrations)

    return ctx
  }

  async deregister(...plugins: string[]): Promise<Context> {
    const ctx = Context.system()

    const deregistrations = plugins.map(async (pl) => {
      const plugin = this.queue.plugins.find((p) => p.name === pl)
      if (plugin) {
        return this.queue.deregister(ctx, plugin, this)
      } else {
        ctx.log('warn', `plugin ${pl} not found`)
      }
    })

    await Promise.all(deregistrations)

    return ctx
  }

  debug(toggle: boolean): Analytics {
    this._debug = toggle
    return this
  }

  reset(): void {
    this._user.reset()
  }

  timeout(timeout: number): void {
    this.settings.timeout = timeout
  }

  private async dispatch(
    event: SegmentEvent,
    callback?: Callback
  ): Promise<DispatchedEvent> {
    const ctx = new Context(event)

    if (isOffline() && !this.options.retryQueue) {
      return ctx
    }

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

  async addSourceMiddleware(fn: MiddlewareFunction): Promise<Analytics> {
    const { sourceMiddlewarePlugin } = await import(
      /* webpackChunkName: "middleware" */ './plugins/middleware'
    )
    const plugin = sourceMiddlewarePlugin(fn)
    await this.register(plugin)
    return this
  }

  async addDestinationMiddleware(
    integrationName: string,
    ...middlewares: MiddlewareFunction[]
  ): Promise<Analytics> {
    const legacyDestinations = this.queue.plugins.filter(
      (xt) =>
        // xt instanceof LegacyDestination &&
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

  async queryString(query: string): Promise<Context[]> {
    const { queryString } = await import(
      /* webpackChunkName: "queryString" */ './core/query-string'
    )
    return queryString(this, query)
  }

  /**
   * @deprecated This function does not register a destination plugin.
   *
   * Instantiates a legacy Analytics.js destination.
   *
   * This function does not register the destination as an Analytics.JS plugin,
   * all the it does it to invoke the factory function back.
   */
  use(legacyPluginFactory: (analytics: Analytics) => void): Analytics {
    legacyPluginFactory(this)
    return this
  }

  async ready(
    callback: Function = (res: Promise<unknown>[]): Promise<unknown>[] => res
  ): Promise<unknown> {
    return Promise.all(
      this.queue.plugins.map((i) => (i.ready ? i.ready() : Promise.resolve()))
    ).then((res) => {
      callback(res)
      return res
    })
  }

  // analytics-classic api

  noConflict(): Analytics {
    console.warn(deprecationWarning)
    window.analytics = _analytics ?? this
    return this
  }

  normalize(msg: SegmentEvent): SegmentEvent {
    console.warn(deprecationWarning)
    return this.eventFactory.normalize(msg)
  }

  get failedInitializations(): string[] {
    console.warn(deprecationWarning)
    return this.queue.failedInitializations
  }

  get VERSION(): string {
    console.warn(deprecationWarning)
    return process.env.VERSION ?? ''
  }

  async initialize(
    settings?: AnalyticsSettings,
    options?: InitOptions
  ): Promise<Analytics> {
    console.warn(deprecationWarning)
    if (settings) {
      await AnalyticsBrowser.load(settings, options)
    }
    this.options = options || {}
    return this
  }

  init = this.initialize.bind(this)

  async pageview(url: string): Promise<Analytics> {
    console.warn(deprecationWarning)
    await this.page({ path: url })
    return this
  }

  get plugins() {
    console.warn(deprecationWarning)
    // @ts-expect-error
    return this._plugins ?? {}
  }

  get Integrations() {
    console.warn(deprecationWarning)
    const integrations = this.queue.plugins
      .filter((plugin) => plugin.type === 'destination')
      .reduce((acc, plugin) => {
        const name = `${plugin.name
          .toLowerCase()
          .split(' ')
          .join('-')}Integration`
        // @ts-expect-error
        const nested = window[name].Integration // hack - Google Analytics function resides in the "Integration" field
        if (nested) {
          // @ts-expect-error
          acc[plugin.name] = nested
          return acc
        }
        // @ts-expect-error
        acc[plugin.name] = window[name]
        return acc
      }, {})

    return integrations
  }

  // analytics-classic stubs

  // essentially console.log in AJSC
  log() {
    console.warn(deprecationWarning)
    return
  }

  // unreleased AJSC feature
  addIntegrationMiddleware() {
    console.warn(deprecationWarning)
    return
  }

  listeners() {
    console.warn(deprecationWarning)
    return
  }

  addEventListener() {
    console.warn(deprecationWarning)
    return
  }

  removeAllListeners() {
    console.warn(deprecationWarning)
    return
  }

  removeListener() {
    console.warn(deprecationWarning)
    return
  }

  removeEventListener() {
    console.warn(deprecationWarning)
    return
  }

  hasListeners() {
    console.warn(deprecationWarning)
    return
  }

  // This function is only used to add GA and Appcue, but these are already being added to Integrations by AJSN
  addIntegration() {
    console.warn(deprecationWarning)
    return
  }

  // The field this function uses is unused in AJSN
  add() {
    console.warn(deprecationWarning)
    return
  }

  // snippet function
  push(args: any[]) {
    const an = this as any
    const method = args.shift()
    if (method) {
      if (!an[method]) return
    }
    an[method].apply(this, args)
  }
}
