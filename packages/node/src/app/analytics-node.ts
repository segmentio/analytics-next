import {
  EventProperties,
  Traits,
  CoreAnalytics,
  CoreContext,
  CorePlugin,
  EventFactory,
  EventQueue,
  CoreOptions,
  CoreSegmentEvent,
  bindAll,
  PriorityQueue,
  pTimeout,
} from '@segment/analytics-core'
import { AnalyticsSettings, validateSettings } from './settings'
import { version } from '../../package.json'
import { createConfiguredNodePlugin } from '../plugins/segmentio'
import { createNodeEventFactory } from '../lib/create-node-event-factory'
import { Callback, dispatchAndEmit } from './dispatch-emit'
import { NodeEmitter } from './emitter'

// create a derived class since we may want to add node specific things to Context later
export class Context extends CoreContext {}

export interface Plugin extends CorePlugin {}

/**
 * An ID associated with the user. Note: at least one of userId or anonymousId must be included.
 **/
type IdentityOptions =
  | { userId: string; anonymousId?: string }
  | { userId?: string; anonymousId: string }

/** Events from CoreOptions */
export interface SegmentEventOptions {
  context?: Context
  timestamp?: CoreOptions['timestamp']
}

class NodePriorityQueue extends PriorityQueue<Context> {
  constructor() {
    super(1, [])
  }
  // do not use an internal "seen" map
  getAttempts(ctx: Context): number {
    return ctx.attempts ?? 0
  }
  updateAttempts(ctx: Context): number {
    ctx.attempts = this.getAttempts(ctx) + 1
    return this.getAttempts(ctx)
  }
}

type SegmentEventType = 'track' | 'page' | 'identify' | 'alias' | 'screen'

export interface SegmentEvent extends CoreSegmentEvent {
  type: SegmentEventType
  options?: SegmentEventOptions
}

export class Analytics extends NodeEmitter implements CoreAnalytics {
  private readonly _eventFactory: EventFactory
  private _isClosed = false
  private _pendingEvents = 0
  private readonly _closeAndFlushDefaultTimeout: number
  private readonly _publisher: ReturnType<
    typeof createConfiguredNodePlugin
  >['publisher']

  private readonly _queue: EventQueue

  ready: Promise<void>

  constructor(settings: AnalyticsSettings) {
    super()
    validateSettings(settings)

    this._eventFactory = createNodeEventFactory()
    this._queue = new EventQueue(new NodePriorityQueue())

    const flushInterval = settings.flushInterval ?? 10000

    this._closeAndFlushDefaultTimeout = flushInterval * 1.25 // add arbitrary multiplier in case an event is in a plugin.

    const { plugin, publisher } = createConfiguredNodePlugin({
      writeKey: settings.writeKey,
      host: settings.host,
      path: settings.path,
      maxRetries: settings.maxRetries ?? 3,
      maxEventsInBatch: settings.maxEventsInBatch ?? 15,
      flushInterval,
    })
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

  private _dispatch(segmentEvent: CoreSegmentEvent, callback?: Callback) {
    if (this._isClosed) {
      this.emit('call_after_close', segmentEvent as SegmentEvent)
      return undefined
    }

    this._pendingEvents++

    dispatchAndEmit(segmentEvent, this._queue, this, callback)
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
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#alias
   */
  alias(
    {
      userId,
      previousId,
      options,
    }: {
      /* The new user id you want to associate with the user. */
      userId: string
      /* The previous id that the user was recognized by (this can be either a userId or an anonymousId). */
      previousId: string
      options?: SegmentEventOptions
    },
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.alias(userId, previousId, options)
    this._dispatch(segmentEvent, callback)
  }

  /**
   * Associates an identified user with a collective.
   *  @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#group
   */
  group(
    {
      groupId,
      userId,
      anonymousId,
      traits = {},
      options = {},
    }: IdentityOptions & {
      groupId: string
      traits?: Traits
      options?: SegmentEventOptions
    },
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.group(groupId, traits, {
      ...options,
      anonymousId,
      userId,
    })

    this._dispatch(segmentEvent, callback)
  }

  /**
   * Includes a unique userId and (maybe anonymousId) and any optional traits you know about them.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#identify
   */
  identify(
    {
      userId,
      anonymousId,
      traits = {},
      options,
    }: IdentityOptions & {
      traits?: Traits
      options?: SegmentEventOptions
    },
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.identify(userId, traits, {
      ...options,
      anonymousId,
      userId,
    })
    this._dispatch(segmentEvent, callback)
  }

  /**
   * The page method lets you record page views on your website, along with optional extra information about the page being viewed.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#page
   */
  page(
    {
      userId,
      anonymousId,
      category,
      name,
      properties,
      options,
      timestamp,
    }: IdentityOptions & {
      /*  The category of the page. Useful for cases like ecommerce where many pages might live under a single category. */
      category?: string
      /* The name of the page.*/
      name?: string
      /* A dictionary of properties of the page. */
      properties?: EventProperties
      timestamp?: string | Date
      options?: SegmentEventOptions
    },
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.page(
      category ?? null,
      name ?? null,
      properties,
      { ...options, anonymousId, userId, timestamp }
    )
    this._dispatch(segmentEvent, callback)
  }

  /**
   * Records screen views on your app, along with optional extra information
   * about the screen viewed by the user.
   *
   * TODO: This is not documented on the segment docs ATM (for node).
   */
  screen(
    {
      userId,
      anonymousId,
      category,
      name,
      properties,
      options,
      timestamp,
    }: Parameters<Analytics['page']>[0],
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.screen(
      category ?? null,
      name ?? null,
      properties,
      { ...options, anonymousId, userId, timestamp }
    )

    this._dispatch(segmentEvent, callback)
  }

  /**
   * Records actions your users perform.
   * @link https://segment.com/docs/connections/sources/catalog/libraries/server/node/#track
   */
  track(
    {
      userId,
      anonymousId,
      event,
      properties,
      options,
    }: IdentityOptions & {
      event: string
      properties?: EventProperties
      options?: SegmentEventOptions
    },
    callback?: Callback
  ): void {
    const segmentEvent = this._eventFactory.track(event, properties, {
      ...options,
      userId,
      anonymousId,
    })

    this._dispatch(segmentEvent, callback)
  }

  /**
   * Registers one or more plugins to augment Analytics functionality.
   * @param plugins
   */
  async register(...plugins: CorePlugin<any, any>[]): Promise<void> {
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

    const deregistrations = pluginNames.map(async (pl) => {
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
