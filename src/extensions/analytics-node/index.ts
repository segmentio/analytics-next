import { Extension } from '../../core/extension'
import { Context } from '../../core/context'
import { v4 as uuid } from '@lukeed/uuid'
import md5 from 'md5'
import { SegmentEvent } from '../../core/events'
import { postToTrackingAPI } from './api'

const embedMetrics = (ctx: Context): Context => {
  const metrics = ctx.stats.serialize()
  ctx.updateEvent('context.metrics', metrics)

  return ctx
}

// To keep parity with the current analytics-node library
export const hydrateMessage = (message: SegmentEvent): SegmentEvent => ({
  properties: message.properties,
  type: message.type,
  context: {
    library: {
      name: 'analytics-node-next',
      version: 'latest',
    },
  },
  timestamp: message.timestamp || new Date(),
  messageId: message.messageId || `node-${md5(JSON.stringify(message))}-${uuid()}`,
  anonymousId: message.anonymousId,
  userId: message.userId,
  _metadata: {
    nodeVersion: process.versions.node,
  },
})

interface AnalyticsNodeSettings {
  writeKey: string
  name: string
  type: Extension['type']
  version: string
}

export function analyticsNode(settings: AnalyticsNodeSettings): Extension {
  const fireEvent = async (ctx: Context): Promise<Context> => {
    ctx = embedMetrics(ctx)

    const hydratedMessage = hydrateMessage(ctx.event)
    await postToTrackingAPI(hydratedMessage, settings.writeKey)

    return ctx
  }

  const xt: Extension = {
    name: settings.name,
    type: settings.type,
    version: settings.version,

    load: (ctx) => Promise.resolve(ctx),
    isLoaded: () => true,

    track: fireEvent,
    identify: fireEvent,
    page: fireEvent,
    alias: fireEvent,
    group: fireEvent,
    screen: fireEvent,
  }

  return xt
}
