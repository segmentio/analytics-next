import {
  CorePlugin,
  CoreSegmentEvent,
  CoreContext,
} from '@segment/analytics-core'
import fetch, { Response } from 'node-fetch'
import { AnalyticsNode } from './analytics-node'
import { version } from '../generated/version'
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
  settings: { writeKey: string },
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
    name: 'analytics-node-next',
    type: 'after',
    version: '1.0.0',
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
