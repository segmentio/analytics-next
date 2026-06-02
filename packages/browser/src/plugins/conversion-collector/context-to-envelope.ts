import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import { toFacade } from '../../lib/to-facade'
import { generateUuidV4, isValidUuidV4 } from './lib/uuid'
import type { AnalyticsEventEnvelope, ConversionEventType } from './types'

type FacadeJson = ReturnType<ReturnType<typeof toFacade>['json']>

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string' && value.length > 0) {
    return value
  }
  return new Date().toISOString()
}

function resolveEventName(json: FacadeJson): string | undefined {
  if (typeof json.event === 'string' && json.event.length > 0) {
    return json.event
  }
  if (typeof json.name === 'string' && json.name.length > 0) {
    return json.name
  }
  return 'page'
}

function resolveEnvelopeType(json: FacadeJson): ConversionEventType | null {
  if (json.type === 'identify') {
    return 'identify'
  }
  if (json.type === 'track' || json.type === 'page' || json.type === 'screen') {
    return 'track'
  }
  return null
}

/**
 * Maps an analytics-next context to the UTUA collector envelope (`version: 2`).
 */
export function contextToEnvelope(
  ctx: Context,
  analytics: Analytics
): AnalyticsEventEnvelope | null {
  const json = toFacade(ctx.event).json()
  const type = resolveEnvelopeType(json)
  if (!type) {
    return null
  }

  const user = analytics.user()
  const timestamp = toIsoString(json.timestamp)
  const anonymousId = json.anonymousId ?? user.anonymousId()
  const userId = json.userId ?? user.id() ?? undefined

  const envelope: AnalyticsEventEnvelope = {
    type,
    anonymous_id: anonymousId,
    user_id: userId || undefined,
    context: (json.context ?? {}) as Record<string, unknown>,
    integrations: json.integrations as Record<string, boolean> | undefined,
    message_id: (() => {
      const id = json.messageId ?? ctx.id
      return typeof id === 'string' && isValidUuidV4(id) ? id : generateUuidV4()
    })(),
    original_timestamp: timestamp,
    timestamp,
    version: 2,
  }

  if (type === 'track') {
    envelope.event_name = resolveEventName(json)
    const properties = { ...(json.properties ?? {}) } as Record<string, unknown>
    delete properties.event_name
    delete properties.eventName
    envelope.properties =
      Object.keys(properties).length > 0 ? properties : undefined
  }

  if (type === 'identify') {
    const traits = { ...(json.traits ?? {}) } as Record<string, unknown>
    envelope.traits = Object.keys(traits).length > 0 ? traits : undefined
    const properties = { ...(json.properties ?? {}) } as Record<string, unknown>
    envelope.properties =
      Object.keys(properties).length > 0 ? properties : undefined
  }

  return envelope
}
