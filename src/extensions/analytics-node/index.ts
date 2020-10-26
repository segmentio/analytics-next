import { Extension } from '../../core/extension'
import { Context } from '../../core/context'
import uuid from '@lukeed/uuid'
import md5 from 'md5'
import { SegmentEvent } from '../../core/events'
import { Track } from '@segment/facade/dist/track'
import { Identify } from '@segment/facade/dist/identify'
import { Page } from '@segment/facade/dist/page'
import { Group } from '@segment/facade/dist/group'
import { Alias } from '@segment/facade/dist/alias'
import { Screen } from '@segment/facade/dist/screen'
import { postToTrackingAPI } from './api'

const embedMetrics = (ctx: Context): Context => {
  const metrics = ctx.stats.serialize()
  ctx.updateEvent('context.metrics', metrics, true)

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
  const fireEvent = async (ctx: Context, type: string): Promise<Context> => {
    ctx = embedMetrics(ctx)

    const hydratedMessage = hydrateMessage(ctx.event)

    let event
    if (type === 'track') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      event = new Track(hydratedMessage, {})
    }

    if (type === 'identify') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      event = new Identify(hydratedMessage, {})
    }

    if (type === 'page') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      event = new Page(hydratedMessage, {})
    }

    if (type === 'group') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      event = new Group(hydratedMessage, {})
    }

    if (type === 'alias') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      event = new Alias(hydratedMessage, {})
    }

    if (type === 'screen') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      event = new Screen(hydratedMessage, {})
    }

    await postToTrackingAPI(event, settings.writeKey)
    return ctx
  }

  const xt: Extension = {
    name: settings.name,
    type: settings.type,
    version: settings.version,

    isLoaded: () => {
      return true
    },

    track: async (ctx: Context): Promise<Context> => {
      return fireEvent(ctx, 'track')
    },

    identify: async (ctx: Context): Promise<Context> => {
      return fireEvent(ctx, 'identify')
    },

    page: async (ctx: Context): Promise<Context> => {
      return fireEvent(ctx, 'page')
    },

    alias: async (ctx: Context): Promise<Context> => {
      return fireEvent(ctx, 'alias')
    },

    group: async (ctx: Context): Promise<Context> => {
      return fireEvent(ctx, 'group')
    },

    screen: async (ctx: Context): Promise<Context> => {
      return fireEvent(ctx, 'screen')
    },

    load: async (ctx, _instance, _config) => {
      return ctx
    },
  }

  return xt
}
