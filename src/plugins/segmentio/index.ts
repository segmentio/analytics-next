import { Facade } from '@segment/facade'
import { Analytics } from '../../analytics'
import { LegacySettings } from '../../browser'
import { isOffline } from '../../core/connection'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { toFacade } from '../../lib/to-facade'
import batch from './batched-dispatcher'
import standard from './fetch-dispatcher'
import { normalize } from './normalize'
import { scheduleFlush } from './schedule-flush'

export type SegmentioSettings = {
  apiKey: string
  apiHost?: string
  protocol?: 'http' | 'https'

  addBundledMetadata?: boolean
  unbundledIntegrations?: string[]
  bundledConfigIds?: string[]
  unbundledConfigIds?: string[]

  maybeBundledConfigIds?: Record<string, string[]>

  deliveryStrategy?: {
    strategy?: 'standard' | 'batching'
    config?: {
      size?: number
      timeout?: number
    }
  }
}

type JSON = ReturnType<Facade['json']>

function onAlias(analytics: Analytics, json: JSON): JSON {
  const user = analytics.user()
  json.previousId =
    json.previousId ?? json.from ?? user.id() ?? user.anonymousId()
  json.userId = json.userId ?? json.to
  delete json.from
  delete json.to
  return json
}

export function segmentio(
  analytics: Analytics,
  settings?: SegmentioSettings,
  integrations?: LegacySettings['integrations']
): Plugin {
  const buffer = analytics.options.disableClientPersistence
    ? new PriorityQueue<Context>(analytics.queue.queue.maxAttempts, [])
    : new PersistedPriorityQueue(
        analytics.queue.queue.maxAttempts,
        `dest-Segment.io`
      )
  const flushing = false

  const apiHost = settings?.apiHost ?? 'api.segment.io/v1'
  const protocol = settings?.protocol ?? 'https'
  const remote = `${protocol}://${apiHost}`

  const client =
    settings?.deliveryStrategy?.strategy === 'batching'
      ? batch(apiHost, settings?.deliveryStrategy?.config)
      : standard()

  async function send(ctx: Context): Promise<Context> {
    if (isOffline()) {
      buffer.push(ctx)
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      scheduleFlush(flushing, buffer, segmentio, scheduleFlush)
      return ctx
    }

    const path = ctx.event.type.charAt(0)
    let json = toFacade(ctx.event).json()

    if (ctx.event.type === 'track') {
      delete json.traits
    }

    if (ctx.event.type === 'alias') {
      json = onAlias(analytics, json)
    }

    return client
      .dispatch(
        `${remote}/${path}`,
        normalize(analytics, json, settings, integrations)
      )
      .then(() => ctx)
      .catch((err) => {
        if (err.type === 'error' || err.message === 'Failed to fetch') {
          buffer.push(ctx)
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          scheduleFlush(flushing, buffer, segmentio, scheduleFlush)
        }
        return ctx
      })
  }

  const segmentio: Plugin = {
    name: 'Segment.io',
    type: 'after',
    version: '0.1.0',
    isLoaded: (): boolean => true,
    load: (): Promise<void> => Promise.resolve(),
    track: send,
    identify: send,
    page: send,
    alias: send,
    group: send,
  }

  return segmentio
}
