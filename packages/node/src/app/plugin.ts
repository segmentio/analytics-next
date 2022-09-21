import {
  CorePlugin,
  CoreSegmentEvent,
  PluginType,
  CoreContext,
} from '@segment/analytics-core'
import fetch, { Response } from 'node-fetch'
import { version } from '../../package.json'
import { AnalyticsNode } from './analytics-node'

export interface AnalyticsNodePluginSettings {
  writeKey: string
  name: string
  type: PluginType
  version: string
}

const btoa = (val: string): string => Buffer.from(val).toString('base64')

export async function post(
  event: CoreSegmentEvent,
  writeKey: string
): Promise<CoreSegmentEvent> {
  const res = await fetch(`https://api.segment.io/v1/${event.type}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'analytics-node-next/latest',
      Authorization: `Basic ${btoa(writeKey)}`,
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    throw res
  }

  return event
}

export function analyticsNode(
  settings: AnalyticsNodePluginSettings,
  analytics: AnalyticsNode
): CorePlugin {
  const send = async (ctx: CoreContext): Promise<CoreContext> => {
    ctx.updateEvent('context.library.name', 'analytics-node-next')
    ctx.updateEvent('context.library.version', version)
    ctx.updateEvent('_metadata.nodeVersion', process.versions.node)
    try {
      await post(ctx.event, settings.writeKey)
    } catch (err: any) {
      analytics.emit('error', {
        ctx,
        code: 'http_delivery',
        message: 'there was an error sending the event to segment',
        response: err as Response,
      })
    }
    return ctx
  }

  return {
    name: settings.name,
    type: settings.type,
    version: settings.version,

    load: (ctx) => Promise.resolve(ctx),
    isLoaded: () => true,

    track: send,
    identify: send,
    page: send,
    alias: send,
    group: send,
    screen: send,
  }
}
