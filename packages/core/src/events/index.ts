export * from './interfaces'
import { v4 as uuid } from '@lukeed/uuid'
import { dset } from 'dset'
import { ID, User } from '../user'
import {
  Integrations,
  EventProperties,
  Traits,
  CoreSegmentEvent,
  CoreOptions,
} from './interfaces'
import md5 from 'spark-md5'

export class EventFactory {
  user?: User

  constructor(user?: User) {
    this.user = user
  }

  track(
    event: string,
    properties?: EventProperties,
    options?: CoreOptions,
    globalIntegrations?: Integrations
  ) {
    return this.normalize({
      ...this.baseEvent(),
      event,
      type: 'track',
      properties: properties ?? {},
      options: { ...options },
      integrations: { ...globalIntegrations },
    })
  }

  page(
    category: string | null,
    page: string | null,
    properties?: EventProperties,
    options?: CoreOptions,
    globalIntegrations?: Integrations
  ): CoreSegmentEvent {
    const event: CoreSegmentEvent = {
      type: 'page',
      properties: { ...properties },
      options: { ...options },
      integrations: { ...globalIntegrations },
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
    })
  }

  screen(
    category: string | null,
    screen: string | null,
    properties?: EventProperties,
    options?: CoreOptions,
    globalIntegrations?: Integrations
  ): CoreSegmentEvent {
    const event: CoreSegmentEvent = {
      type: 'screen',
      properties: { ...properties },
      options: { ...options },
      integrations: { ...globalIntegrations },
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
    })
  }

  identify(
    userId: ID,
    traits?: Traits,
    options?: CoreOptions,
    globalIntegrations?: Integrations
  ): CoreSegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'identify',
      userId,
      traits,
      options,
      integrations: globalIntegrations,
    })
  }

  group(
    groupId: ID,
    traits?: Traits,
    options?: CoreOptions,
    globalIntegrations?: Integrations
  ): CoreSegmentEvent {
    return this.normalize({
      ...this.baseEvent(),
      type: 'group',
      traits,
      options: { ...options },
      integrations: { ...globalIntegrations },
      groupId,
    })
  }

  alias(
    to: string,
    from: string | null,
    options?: CoreOptions,
    globalIntegrations?: Integrations
  ): CoreSegmentEvent {
    const base: CoreSegmentEvent = {
      userId: to,
      type: 'alias',
      options: { ...options },
      integrations: { ...globalIntegrations },
    }

    if (from !== null) {
      base.previousId = from
    }

    if (to === undefined) {
      return this.normalize({
        ...base,
        ...this.baseEvent(),
      })
    }

    return this.normalize({
      ...this.baseEvent(),
      ...base,
    })
  }

  private baseEvent(): Partial<CoreSegmentEvent> {
    const base: Partial<CoreSegmentEvent> = {
      integrations: {},
      options: {},
    }

    if (!this.user) return base

    const user = this.user

    if (user.id()) {
      base.userId = user.id()
    }

    if (user.anonymousId()) {
      base.anonymousId = user.anonymousId()
    }

    return base
  }

  /**
   * Builds the context part of an event based on "foreign" keys that
   * are provided in the `Options` parameter for an Event
   */
  private context(event: CoreSegmentEvent): [object, object] {
    const optionsKeys = ['integrations', 'anonymousId', 'timestamp', 'userId']

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

  public normalize(event: CoreSegmentEvent): CoreSegmentEvent {
    const integrationBooleans = Object.keys(event.integrations ?? {}).reduce(
      (integrationNames, name) => {
        return {
          ...integrationNames,
          [name]: Boolean(event.integrations?.[name]),
        }
      },
      {} as Record<string, boolean>
    )

    // This is pretty trippy, but here's what's going on:
    // - a) We don't pass initial integration options as part of the event, only if they're true or false
    // - b) We do accept per integration overrides (like integrations.Amplitude.sessionId) at the event level
    // Hence the need to convert base integration options to booleans, but maintain per event integration overrides
    const allIntegrations = {
      // Base config integrations object as booleans
      ...integrationBooleans,

      // Per event overrides, for things like amplitude sessionId, for example
      ...event.options?.integrations,
    }

    const [context, overrides] = this.context(event)
    const { options, ...rest } = event

    const body = {
      timestamp: new Date(),
      ...rest,
      context,
      integrations: allIntegrations,
      ...overrides,
    }

    const messageId = 'ajs-next-' + md5.hash(JSON.stringify(body) + uuid())

    const evt: CoreSegmentEvent = {
      ...body,
      messageId,
    }

    return evt
  }
}
