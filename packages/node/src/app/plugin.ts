import {
  CorePlugin,
  CoreSegmentEvent,
  PluginType,
  CoreContext,
} from '@segment/analytics-core'
import fetch from 'node-fetch'
import { version } from '../../package.json'

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
    throw new Error('Message Rejected')
  }

  return event
}

export function analyticsNode(
  settings: AnalyticsNodePluginSettings
): CorePlugin {
  const send = async (ctx: CoreContext): Promise<CoreContext> => {
    ctx.updateEvent('context.library.name', 'analytics-node-next')
    ctx.updateEvent('context.library.version', version)
    ctx.updateEvent('_metadata.nodeVersion', process.versions.node)

    await post(ctx.event, settings.writeKey)
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
