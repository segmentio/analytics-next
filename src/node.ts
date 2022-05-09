import { Analytics } from './analytics'
import { Context } from './core/context'
import { validation } from './plugins/validation'
import { analyticsNode } from './plugins/analytics-node'
import { Plugin } from './core/plugin'
import { EventQueue } from './core/queue/event-queue'
import { PriorityQueue } from './lib/priority-queue'
import { Options } from './core/events/interfaces'
import { Callback, DispatchedEvent } from './core/arguments-resolver'
import { Emitter } from './core/emitter'

export type Identity =
  | { userId: string; anonymousId?: string }
  | { userId?: string; anonymousId: string }

export type NodeOptions = Options & Identity

export interface AnalyticsNodeJs extends Emitter {
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
    options?: Options,
    callback?: Callback
  ): Promise<DispatchedEvent>

  /**
   * Associates an identified user with a collective.
   * @param groupId - The group id to associate with the provided user.
   * @param options - A dictionary of options including the user id.
   * @param callback
   */
  group(
    groupId: string,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>
  /**
   * Associates an identified user with a collective.
   * @param groupId - The group id to associate with the provided user.
   * @param traits - A dictionary of traits for the group.
   * @param options - A dictionary of options including the user id.
   * @param callback
   */
  group(
    groupId: string,
    traits: object,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>

  /**
   * Record traits about a user.
   * Includes a unique userId and/or anonymousId and any optional traits you know about them.
   * @param traits
   * @param options
   * @param callback
   */
  identify(
    traits: object,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>

  /**
   * Records page views on your website, along with optional extra information
   * about the page viewed by the user.
   * @param properties
   * @param options
   * @param callback
   */
  page(
    properties: object,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>
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
    properties: object,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>
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
    properties: object,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>

  /**
   * Records screen views on your app, along with optional extra information
   * about the screen viewed by the user.
   * @param properties
   * @param options
   * @param callback
   */
  screen(
    properties: object,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>
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
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>

  /**
   * Records actions your users perform.
   * @param event - The name of the event you're tracking.
   * @param options
   * @param callback
   */
  track(
    event: string,
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>
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
    options: NodeOptions,
    callback?: Callback
  ): Promise<DispatchedEvent>

  /**
   * Registers one or more plugins to augment Analytics functionality.
   * @param plugins
   */
  register(...plugins: Plugin[]): Promise<Context>

  /**
   * Deregisters one or more plugins based on their names.
   * @param pluginNames - The names of one or more plugins to deregister.
   */
  deregister(...pluginNames: string[]): Promise<Context>

  get VERSION(): string
}

export class AnalyticsNode {
  static async load(settings: {
    writeKey: string
  }): Promise<[AnalyticsNodeJs, Context]> {
    const cookieOptions = {
      persist: false,
    }

    const queue = new EventQueue(new PriorityQueue(3, []))
    const options = { user: cookieOptions, group: cookieOptions }
    const analytics = new Analytics(settings, options, queue)

    const nodeSettings = {
      writeKey: settings.writeKey,
      name: 'analytics-node-next',
      type: 'after' as Plugin['type'],
      version: 'latest',
    }

    const ctx = await analytics.register(
      validation,
      analyticsNode(nodeSettings)
    )
    analytics.emit('initialize', settings, cookieOptions ?? {})

    return [analytics, ctx]
  }
}
