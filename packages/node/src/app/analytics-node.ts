import {
  CoreAnalytics,
  bindAll,
  pTimeout,
} from '@customerio/cdp-analytics-core'
import { AnalyticsSettings, validateSettings } from './settings'
import { version } from '../generated/version'
import { createConfiguredNodePlugin } from '../plugins/customerio'
import { NodeEventFactory } from './event-factory'
import { Callback, dispatchAndEmit } from './dispatch-emit'
import { NodeEmitter } from './emitter'
import {
  AliasParams,
  GroupParams,
  IdentifyParams,
  PageParams,
  TrackParams,
  Plugin,
  CustomerioEvent,
} from './types'
import { Context } from './context'
import { NodeEventQueue } from './event-queue'

export class Analytics extends NodeEmitter implements CoreAnalytics {
  private readonly _eventFactory: NodeEventFactory
  private _isClosed = false
  private _pendingEvents = 0
  private readonly _closeAndFlushDefaultTimeout: number
  private readonly _publisher: ReturnType<
    typeof createConfiguredNodePlugin
  >['publisher']

  private readonly _queue: NodeEventQueue

  ready: Promise<void>

  constructor(settings: AnalyticsSettings) {
    super()
    validateSettings(settings)

    this._eventFactory = new NodeEventFactory()
    this._queue = new NodeEventQueue()

    const flushInterval = settings.flushInterval ?? 10000

    this._closeAndFlushDefaultTimeout = flushInterval * 1.25 // add arbitrary multiplier in case an event is in a plugin.

    const { plugin, publisher } = createConfiguredNodePlugin(
      {
        writeKey: settings.writeKey,
        host: settings.host,
        path: settings.path,
        maxRetries: settings.maxRetries ?? 3,
        maxEventsInBatch: settings.maxEventsInBatch ?? 15,
        httpRequestTimeout: settings.httpRequestTimeout,
        flushInterval,
      },
      this as NodeEmitter
    )
    this._publisher = publisher
    this.ready = this.register(plugin).then(() => undefined)

    this.emit('initialize', settings)

    bindAll(this)
  }

  get VERSION() {
    return version
  }

  /**
   * Call this method to stop collecting new events and flush all existing events.
   * This method also waits for any event method-specific callbacks to be triggered,
   * and any of their subsequent promises to be resolved/rejected.
   */
  public closeAndFlush({
    timeout = this._closeAndFlushDefaultTimeout,
  }: {
    /** Set a maximum time permitted to wait before resolving. */
    timeout?: number
  } = {}): Promise<void> {
    this._publisher.flushAfterClose(this._pendingEvents)
    this._isClosed = true
    const promise = new Promise<void>((resolve) => {
      if (!this._pendingEvents) {
        resolve()
      } else {
        this.once('drained', () => resolve())
      }
    })
    return timeout ? pTimeout(promise, timeout).catch(() => undefined) : promise
  }

  private _dispatch(CustomerioEvent: CustomerioEvent, callback?: Callback) {
    if (this._isClosed) {
      this.emit('call_after_close', CustomerioEvent as CustomerioEvent)
      return undefined
    }

    this._pendingEvents++

    dispatchAndEmit(CustomerioEvent, this._queue, this, callback)
      .catch((ctx) => ctx)
      .finally(() => {
        this._pendingEvents--

        if (!this._pendingEvents) {
          this.emit('drained')
        }
      })
  }

  /**
   * Combines two unassociated user identities.
   */
  alias(
    { userId, previousId, context, timestamp, integrations }: AliasParams,
    callback?: Callback
  ): void {
    const CustomerioEvent = this._eventFactory.alias(userId, previousId, {
      context,
      integrations,
      timestamp,
    })
    this._dispatch(CustomerioEvent, callback)
  }

  /**
   * Associates an identified user with a collective.
   */
  group(
    {
      timestamp,
      groupId,
      userId,
      anonymousId,
      traits = {},
      context,
      integrations,
    }: GroupParams,
    callback?: Callback
  ): void {
    const CustomerioEvent = this._eventFactory.group(groupId, traits, {
      context,
      anonymousId,
      userId,
      timestamp,
      integrations,
    })

    this._dispatch(CustomerioEvent, callback)
  }

  /**
   * Includes a unique userId and (maybe anonymousId) and any optional traits you know about them.
   */
  identify(
    {
      userId,
      anonymousId,
      traits = {},
      context,
      timestamp,
      integrations,
    }: IdentifyParams,
    callback?: Callback
  ): void {
    const CustomerioEvent = this._eventFactory.identify(userId, traits, {
      context,
      anonymousId,
      userId,
      timestamp,
      integrations,
    })
    this._dispatch(CustomerioEvent, callback)
  }

  /**
   * The page method lets you record page views on your website, along with optional extra information about the page being viewed.
   */
  page(
    {
      userId,
      anonymousId,
      category,
      name,
      properties,
      context,
      timestamp,
      integrations,
    }: PageParams,
    callback?: Callback
  ): void {
    const CustomerioEvent = this._eventFactory.page(
      category ?? null,
      name ?? null,
      properties,
      { context, anonymousId, userId, timestamp, integrations }
    )
    this._dispatch(CustomerioEvent, callback)
  }

  /**
   * Records screen views on your app, along with optional extra information
   * about the screen viewed by the user.
   */
  screen(
    {
      userId,
      anonymousId,
      category,
      name,
      properties,
      context,
      timestamp,
      integrations,
    }: PageParams,
    callback?: Callback
  ): void {
    const CustomerioEvent = this._eventFactory.screen(
      category ?? null,
      name ?? null,
      properties,
      { context, anonymousId, userId, timestamp, integrations }
    )

    this._dispatch(CustomerioEvent, callback)
  }

  /**
   * Records actions your users perform.
   */
  track(
    {
      userId,
      anonymousId,
      event,
      properties,
      context,
      timestamp,
      integrations,
    }: TrackParams,
    callback?: Callback
  ): void {
    const CustomerioEvent = this._eventFactory.track(event, properties, {
      context,
      userId,
      anonymousId,
      timestamp,
      integrations,
    })

    this._dispatch(CustomerioEvent, callback)
  }

  /**
   * Registers one or more plugins to augment Analytics functionality.
   * @param plugins
   */
  register(...plugins: Plugin[]): Promise<void> {
    return this._queue.criticalTasks.run(async () => {
      const ctx = Context.system()

      const registrations = plugins.map((xt) =>
        this._queue.register(ctx, xt, this)
      )
      await Promise.all(registrations)
      this.emit(
        'register',
        plugins.map((el) => el.name)
      )
    })
  }

  /**
   * Deregisters one or more plugins based on their names.
   * @param pluginNames - The names of one or more plugins to deregister.
   */
  async deregister(...pluginNames: string[]): Promise<void> {
    const ctx = Context.system()

    const deregistrations = pluginNames.map((pl) => {
      const plugin = this._queue.plugins.find((p) => p.name === pl)
      if (plugin) {
        return this._queue.deregister(ctx, plugin, this)
      } else {
        ctx.log('warn', `plugin ${pl} not found`)
      }
    })

    await Promise.all(deregistrations)
    this.emit('deregister', pluginNames)
  }
}
