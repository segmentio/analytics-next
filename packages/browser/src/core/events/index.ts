import { v4 as uuid } from '@lukeed/uuid'
import { ID, User } from '../user'
import { Options, EventProperties, Traits, SegmentEvent } from './interfaces'
import { addPageContext, PageContext } from '../page'
import { CoreEventFactory, IntegrationsOptions } from '@segment/analytics-core'

export * from './interfaces'

export class EventFactory extends CoreEventFactory {
  user: User
  constructor(user: User) {
    super({
      createMessageId: () => `ajs-next-${Date.now()}-${uuid()}`,
      onEventMethodCall: ({ options }) => {
        this.maybeUpdateAnonId(options)
      },
      onFinishedEvent: (event) => {
        this.addIdentity(event)
        return event
      },
    })
    this.user = user
  }

  /**
   * Updates the anonymousId *globally* if it's provided in the options.
   * This should generally be done in the identify method, but some customers rely on this.
   */
  private maybeUpdateAnonId(options: Options | undefined): void {
    options?.anonymousId && this.user.anonymousId(options.anonymousId)
  }

  /**
   * add user id / anonymous id to the event
   */
  private addIdentity(event: SegmentEvent) {
    if (this.user.id()) {
      event.userId = this.user.id()
    }

    if (this.user.anonymousId()) {
      event.anonymousId = this.user.anonymousId()
    }
  }

  override track(
    event: string,
    properties?: EventProperties,
    options?: Options,
    integrationsOptions?: IntegrationsOptions,
    pageCtx?: PageContext
  ): SegmentEvent {
    const ev = super.track(event, properties, options, integrationsOptions)
    addPageContext(ev, pageCtx)
    return ev
  }

  override page(
    category: string | null,
    page: string | null,
    properties?: EventProperties,
    options?: Options,
    integrationsOptions?: IntegrationsOptions,
    pageCtx?: PageContext
  ): SegmentEvent {
    const ev = super.page(
      category,
      page,
      properties,
      options,
      integrationsOptions
    )
    addPageContext(ev, pageCtx)
    return ev
  }

  override screen(
    category: string | null,
    screen: string | null,
    properties?: EventProperties,
    options?: Options,
    integrationsOptions?: IntegrationsOptions,
    pageCtx?: PageContext
  ): SegmentEvent {
    const ev = super.screen(
      category,
      screen,
      properties,
      options,
      integrationsOptions
    )
    addPageContext(ev, pageCtx)
    return ev
  }

  override identify(
    userId: ID,
    traits?: Traits,
    options?: Options,
    integrationsOptions?: IntegrationsOptions,
    pageCtx?: PageContext
  ): SegmentEvent {
    const ev = super.identify(userId, traits, options, integrationsOptions)
    addPageContext(ev, pageCtx)
    return ev
  }

  override group(
    groupId: ID,
    traits?: Traits,
    options?: Options,
    integrationsOptions?: IntegrationsOptions,
    pageCtx?: PageContext
  ): SegmentEvent {
    const ev = super.group(groupId, traits, options, integrationsOptions)
    addPageContext(ev, pageCtx)
    return ev
  }

  override alias(
    to: string,
    from: string | null,
    options?: Options,
    integrationsOptions?: IntegrationsOptions,
    pageCtx?: PageContext
  ): SegmentEvent {
    const ev = super.alias(to, from, options, integrationsOptions)
    addPageContext(ev, pageCtx)
    return ev
  }
}
