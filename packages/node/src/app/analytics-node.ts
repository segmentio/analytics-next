import {
  EventProperties,
  Traits,
  Emitter,
  CoreAnalytics,
  CoreContext,
  CorePlugin,
  EventFactory,
  EventQueue,
  dispatch,
  resolvePageArguments,
  PageParams,
  Integrations,
  CoreOptions,
  Callback,
  CoreSegmentEvent,
  bindAll,
} from '@segment/analytics-core'

import { version } from '../../package.json'

/** create a derived class since we may want to add node specific things to Context later  */
export class NodeContext extends CoreContext {}

export type NodeSegmentEventOptions = CoreOptions & Identity

export type Identity =
  | { userId: string; anonymousId?: string }
  | { userId?: string; anonymousId: string }

type NodeSegmentEventType = 'track' | 'page' | 'identify' | 'alias' | 'screen'

export interface NodeSegmentEvent extends CoreSegmentEvent {
  type: NodeSegmentEventType
  options?: NodeSegmentEventOptions
}

export interface AnalyticsSettings {
  writeKey: string
  timeout?: number
  plugins?: CorePlugin[]
}

export interface InitOptions {
  integrations?: Integrations
  retryQueue?: boolean
}

export class AnalyticsNode extends Emitter implements CoreAnalytics {
  private eventFactory: EventFactory
  protected settings: AnalyticsSettings
  integrations: Integrations
  options: InitOptions
  queue: EventQueue
  get VERSION() {
    return version
  }
  constructor(
    settings: AnalyticsSettings,
    options: InitOptions,
    queue: EventQueue
  ) {
    super()
    this.settings = settings
    this.eventFactory = new EventFactory()
    this.integrations = options?.integrations ?? {}
    this.options = options ?? {}
    this.queue = queue
    bindAll(this)
  }

  /**
   * Combines two unassociated user identities.
   * @param userId - The new user id you want to associate with the user.
   * @param previousId - The previous id that the user was recognized by.
   * @param options
   * @param callback
   */
  alias(
    userId: string,
    previousId: string,
    options?: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext> {
    const segmentEvent = this.eventFactory.alias(
      userId,
      previousId,
      options,
      this.integrations
    )
    return dispatch(segmentEvent, this.queue, this, {
      callback: callback,
      retryQueue: this.options.retryQueue,
    })
      .then((ctx) => {
        this.emit('alias', userId, previousId, ctx.event.options)
        return ctx
      })
      .catch((ctx) => ctx)
  }

  /**
   * Associates an identified user with a collective.
   * @param groupId - The group id to associate with the provided user.
   * @param traits - A dictionary of traits for the group.
   * @param options - A dictionary of options including the user id.
   * @param callback
   */
  group(
    groupId: string,
    traits: Traits,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext> {
    const segmentEvent = this.eventFactory.group(
      groupId,
      traits,
      options,
      this.integrations
    )

    return dispatch(segmentEvent, this.queue, this, { callback })
      .then((ctx) => {
        this.emit('group', groupId, ctx.event.traits, ctx.event.options)
        return ctx
      })
      .catch((ctx) => ctx)
  }

  /**
   * Includes a unique userId and/or anonymousId and any optional traits you know about them.
   * @param userId
   * @param traits
   * @param options
   * @param callback
   */
  identify(
    userId: string,
    traits: Traits = {},
    options?: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext> {
    const segmentEvent = this.eventFactory.identify(
      userId,
      traits,
      options,
      this.integrations
    )

    return dispatch(segmentEvent, this.queue, this, { callback })
      .then((ctx) => {
        this.emit('identify', userId, ctx.event.traits, ctx.event.options)
        return ctx
      })
      .catch((ctx) => ctx)
  }

  /**
   * Records page views on your website, along with optional extra information
   * about the page viewed by the user.
   * @param properties
   * @param options
   * @param callback
   */
  page(
    properties: EventProperties,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext>
  /**
   * Records page views on your website, along with optional extra information
   * about the page viewed by the user.
   * @param name - The name of the page.
   * @param properties - A dictionary of properties of the page.
   * @param options
   * @param callback
   */
  page(
    name: string,
    properties: EventProperties,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext>
  /**
   * Records page views on your website, along with optional extra information
   * about the page viewed by the user.
   * @param category - The category of the page.
   * Useful for cases like ecommerce where many pages might live under a single category.
   * @param name - The name of the page.
   * @param properties - A dictionary of properties of the page.
   * @param options
   * @param callback
   */
  page(
    category: string,
    name: string,
    properties: EventProperties,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext>

  page(...args: PageParams): Promise<NodeContext> {
    const [category, page, properties, options, callback] =
      resolvePageArguments(...args)

    const segmentEvent = this.eventFactory.page(
      category,
      page,
      properties,
      options,
      this.integrations
    )

    return dispatch(segmentEvent, this.queue, this, { callback })
      .then((ctx) => {
        this.emit(
          'page',
          category,
          page,
          ctx.event.properties,
          ctx.event.options
        )
        return ctx
      })
      .catch((ctx) => ctx)
  }

  /**
   * Records screen views on your app, along with optional extra information
   * about the screen viewed by the user.
   * @param properties
   * @param options
   * @param callback
   */
  screen(
    properties: object,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext>
  /**
   * Records screen views on your app, along with optional extra information
   * about the screen viewed by the user.
   * @param name - The name of the screen.
   * @param properties
   * @param options
   * @param callback
   */
  screen(
    name: string,
    properties: object,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext>

  screen(...args: PageParams): Promise<NodeContext> {
    const [category, page, properties, options, callback] =
      resolvePageArguments(...args)

    const segmentEvent = this.eventFactory.screen(
      category,
      page,
      properties,
      options,
      this.integrations
    )

    return dispatch(segmentEvent, this.queue, this, { callback })
      .then((ctx) => {
        this.emit(
          'page',
          category,
          page,
          ctx.event.properties,
          ctx.event.options
        )
        return ctx
      })
      .catch((ctx) => ctx)
  }
  /**
   * Records actions your users perform.
   * @param event - The name of the event you're tracking.
   * @param properties - A dictionary of properties for the event.
   * @param options
   * @param callback
   */
  track(
    event: string,
    properties: object,
    options: NodeSegmentEventOptions,
    callback?: Callback
  ): Promise<NodeContext> {
    const segmentEvent = this.eventFactory.track(
      event,
      properties as EventProperties,
      options,
      this.integrations
    )

    return dispatch(segmentEvent, this.queue, this, {
      callback,
    })
      .then((ctx) => {
        this.emit('track', event, ctx.event.properties, ctx.event.options)
        return ctx
      })
      .catch((ctx) => ctx)
  }

  /**
   * Registers one or more plugins to augment Analytics functionality.
   * @param plugins
   */
  async register(...plugins: CorePlugin<any, any>[]): Promise<NodeContext> {
    const ctx = NodeContext.system()

    const registrations = plugins.map((xt) =>
      this.queue.register(ctx, xt, this)
    )
    await Promise.all(registrations)

    return ctx
  }

  /**
   * Deregisters one or more plugins based on their names.
   * @param pluginNames - The names of one or more plugins to deregister.
   */
  async deregister(...pluginNames: string[]): Promise<NodeContext> {
    const ctx = CoreContext.system()

    const deregistrations = pluginNames.map(async (pl) => {
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
}
