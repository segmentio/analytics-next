import { v4 as uuid } from '@lukeed/uuid'
import dset from 'dset'
import { ID, User } from '../user'
import { Options, Integrations, SegmentEvent } from './interfaces'
export * from './interfaces'

export class EventFactory {
  user: User

  constructor(user: User) {
    this.user = user
  }

  track(
    event: string,
    properties?: SegmentEvent['properties'],
    options?: Options,
    integrations?: Integrations
  ): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      event,
      type: 'track' as const,
      properties,
      options: { ...options },
      integrations: { ...integrations },
    })
  }

  page(
    category: string | null,
    page: string | null,
    properties?: object,
    options?: Options,
    integrations?: Integrations
  ): SegmentEvent {
    const event: Partial<SegmentEvent> = {
      type: 'page' as const,
      properties: { ...properties },
      options: { ...options },
      integrations: { ...integrations },
    }

    if (category !== null) {
      event.category = category
      event.properties = event.properties ?? {}
      event.properties.category = category
    }

    if (page !== null) {
      event.name = page
    }

    return this.normalize({
      ...this.baseEvent(),
      ...event,
    } as SegmentEvent)
  }

  screen(
    category: string | null,
    screen: string | null,
    properties?: object,
    options?: Options,
    integrations?: Integrations
  ): SegmentEvent {
    const event: Partial<SegmentEvent> = {
      type: 'screen' as const,
      properties: { ...properties },
      options: { ...options },
      integrations: { ...integrations },
    }

    if (category !== null) {
      event.category = category
    }

    if (screen !== null) {
      event.name = screen
    }

    return this.normalize({
      ...this.baseEvent(),
      ...event,
    } as SegmentEvent)
  }

  identify(
    userId: ID,
    traits?: SegmentEvent['traits'],
    options?: Options,
    integrations?: Integrations
  ): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'identify' as const,
      userId,
      traits,
      options: { ...options },
      integrations: { ...integrations },
    })
  }

  group(
    groupId: ID,
    traits?: SegmentEvent['traits'],
    options?: Options,
    integrations?: Integrations
  ): SegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'group' as const,
      traits,
      options: { ...options },
      integrations: { ...integrations },
      groupId,
    })
  }

  alias(
    to: string,
    from: string | null,
    options?: Options,
    integrations?: Integrations
  ): SegmentEvent {
    const base: Partial<SegmentEvent> = {
      userId: to,
      type: 'alias' as const,
      options: { ...options },
      integrations: { ...integrations },
    }

    if (from !== null) {
      base.previousId = from
    }

    return this.normalize({
      ...this.baseEvent(),
      ...base,
    } as SegmentEvent)
  }

  private baseEvent(): Partial<SegmentEvent> {
    const base: Partial<SegmentEvent> = {
      integrations: {},
      options: {},
    }

    if (this.user.id()) {
      base.userId = this.user.id()
    } else {
      base.anonymousId = this.user.anonymousId()
    }

    return base
  }

  /**
   * Builds the context part of an event based on "foreign" keys that
   * are provided in the `Options` parameter for an Event
   */
  private context(event: SegmentEvent): [object, object] {
    const optionsKeys = ['integrations', 'anonymousId', 'timestamp']

    const options = event.options ?? {}
    delete options['integrations']

    const providedOptionsKeys = Object.keys(options)

    const context = event.options?.context ?? {}
    const overrides = {}

    providedOptionsKeys.forEach((key) => {
      if (key === 'context') {
        return
      }

      if (optionsKeys.includes(key)) {
        dset(overrides, key, options[key])
      } else {
        dset(context, key, options[key])
      }
    })

    return [context, overrides]
  }

  public normalize(event: SegmentEvent): SegmentEvent {
    const allIntegrations = {
      // Base config integrations object
      ...event.integrations,
      // Per event overrides
      ...event.options?.integrations,
    }

    const [context, overrides] = this.context(event)
    const { options, ...rest } = event

    return {
      ...rest,
      context,
      integrations: allIntegrations,
      messageId: 'ajs-next-' + uuid(),
      ...overrides,
    }
  }
}
