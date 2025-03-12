import type { Analytics, AnalyticsSettings, InitOptions } from '.'
import type { Plugin } from '../plugin'
import type {
  EventParams,
  DispatchedEvent,
  PageParams,
  IdentifyParams,
  AliasParams,
  GroupParams,
} from '../arguments-resolver'
import type { Context } from '../context'
import type { SegmentEvent } from '../events'
import type { Group, User } from '../user'
import type { LegacyIntegration } from '../../plugins/ajs-destination/types'
import { CoreAnalytics } from '@segment/analytics-core'

// we can define a contract because:
// - it gives us a neat place to put all our typedocs (they end up being inherited by the class that implements them).
// - it makes it easy to reason about what's being shared between browser and node

/**
 * All of these methods are a no-op.
 */
/** @deprecated */
interface AnalyticsClassicStubs {
  /** @deprecated */
  log(this: never): void
  /** @deprecated */
  addIntegrationMiddleware(this: never): void
  /** @deprecated */
  listeners(this: never): void
  /** @deprecated */
  addEventListener(this: never): void
  /** @deprecated */
  removeAllListeners(this: never): void
  /** @deprecated */
  removeListener(this: never): void
  /** @deprecated */
  removeEventListener(this: never): void
  /** @deprecated */
  hasListeners(this: never): void
  /** @deprecated */
  // This function is only used to add GA and Appcue, but these are already being added to Integrations by AJSN
  addIntegration(this: never): void
  /** @deprecated */
  add(this: never): void
}

/** @deprecated */
export interface AnalyticsClassic extends AnalyticsClassicStubs {
  /** @deprecated */
  initialize(
    settings?: AnalyticsSettings,
    options?: InitOptions
  ): Promise<Analytics>

  /** @deprecated */
  noConflict(): Analytics

  /** @deprecated */
  normalize(msg: SegmentEvent): SegmentEvent

  /** @deprecated */
  readonly failedInitializations: string[]

  /** @deprecated */
  pageview(url: string): Promise<Analytics>

  /**  @deprecated*/
  readonly plugins: any

  /** @deprecated */
  readonly Integrations: Record<string, LegacyIntegration>
}

/**
 * Interface implemented by concrete Analytics class (commonly accessible if you use "await" on AnalyticsBrowser.load())
 */
export interface AnalyticsCore extends CoreAnalytics {
  /**
   * Tracks an event.
   * @param args - Event parameters.
   * @example
   * ```ts
   *  analytics.track('Event Name', {
   *    property1: 'value1',
   *    property2: 'value2'
   *  });
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#track
   * @returns A promise that resolves to a dispatched event.
   */
  track(...args: EventParams): Promise<DispatchedEvent>

  /**
   * Tracks a page view.
   * @param args - `[category], [name], [properties], [options], [callback]`
   * @example
   * ```ts
   *  analytics.page('My Category', 'Pricing', {
   *    title: 'My Overridden Title',
   *    myExtraProp: 'foo'
   *  })
   *
   *  analytics.page('Pricing', {
   *    title: 'My Overridden Title',
   *    myExtraProp: 'foo'
   *  });
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#page
   * @returns A promise that resolves to a dispatched event.
   */
  page(...args: PageParams): Promise<DispatchedEvent>

  /**
   * Identifies a user.
   * @param args - Identify parameters.
   * @example
   * ```ts
   *  analytics.identify('userId123', {
   *    email: 'user@example.com',
   *    name: 'John Doe'
   *  });
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#identify
   * @returns A promise that resolves to a dispatched event.
   */
  identify(...args: IdentifyParams): Promise<DispatchedEvent>

  /**
   * Gets the group.
   * @returns The group.
   */
  group(): Group

  /**
   * Sets the group.
   * @param args - Group parameters.
   * @example
   * ```ts
   *  analytics.group('groupId123', {
   *    name: 'Company Inc.',
   *    industry: 'Software'
   *  });
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#group
   * @returns A promise that resolves to a dispatched event.
   */
  group(...args: GroupParams): Promise<DispatchedEvent>

  /**
   * Creates an alias for a user.
   * @param args - Alias parameters.
   * @example
   * ```ts
   *  analytics.alias('newUserId123', 'oldUserId456');
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#alias
   * @returns A promise that resolves to a dispatched event.
   */
  alias(...args: AliasParams): Promise<DispatchedEvent>

  /**
   * Tracks a screen view.
   * @param args - Page parameters.
   * @example
   * ```ts
   *  analytics.screen('Home Screen', {
   *    title: 'Home',
   *    section: 'Main'
   *  });
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#screen
   * @returns A promise that resolves to a dispatched event.
   */
  screen(...args: PageParams): Promise<DispatchedEvent>

  /**
   * Registers plugins.
   * @param plugins - Plugins to register.
   * @example
   * ```ts
   *  analytics.register(plugin1, plugin2);
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#register
   * @returns A promise that resolves to the context.
   */
  register(...plugins: Plugin[]): Promise<Context>

  /**
   * Deregisters plugins.
   * @param plugins - Plugin names to deregister.
   * @example
   * ```ts
   *  analytics.deregister('plugin1', 'plugin2');
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#deregister
   * @returns A promise that resolves to the context.
   */
  deregister(...plugins: string[]): Promise<Context>

  /**
   * Gets the user.
   * @returns The user.
   */
  user(): User

  /**
   * The version of the analytics library.
   */
  readonly VERSION: string
}

/**
 * Interface implemented by AnalyticsBrowser (buffered version of analytics) (commonly accessible through AnalyticsBrowser.load())
 */
export interface AnalyticsBrowserCore
  extends Omit<AnalyticsCore, 'group' | 'user'> {
  /**
   * Gets the group.
   * @returns A promise that resolves to the group.
   */
  group(): Promise<Group>

  /**
   * Sets the group.
   * @param args - Group parameters.
   * @example
   * ```ts
   *  analytics.group('groupId123', {
   *    name: 'Company Inc.',
   *    industry: 'Software'
   *  });
   * ```
   * @link https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#group
   * @returns A promise that resolves to a dispatched event.
   */
  group(...args: GroupParams): Promise<DispatchedEvent>

  /**
   * Gets the user.
   * @returns A promise that resolves to the user.
   */
  user(): Promise<User>
}
