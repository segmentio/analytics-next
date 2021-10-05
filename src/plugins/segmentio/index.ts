/* eslint-disable @typescript-eslint/no-use-before-define */
import { Facade } from '@segment/facade'
import { Analytics } from '../../analytics'
import { LegacySettings } from '../../browser'
import { isOffline } from '../../core/connection'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { toFacade } from '../../lib/to-facade'
import { flushQueue } from '../ajs-destination'
import batch from './batched-dispatcher'
import standard from './fetch-dispatcher'
import { normalize } from './normalize'

export interface SegmentioSettings {
  apiKey: string
  apiHost?: string

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
  // delete during code review: should this be `Segment.io` or `dest-Segment.io` ?
  let buffer = new PersistedPriorityQueue(
    analytics.queue.queue.maxAttempts,
    `dest-Segment.io`
  )
  let flushing = false

  const apiHost = settings?.apiHost ?? 'api.segment.io/v1'
  const remote = `https://${apiHost}`

  const client =
    settings?.deliveryStrategy?.strategy === 'batching'
      ? batch(apiHost, settings?.deliveryStrategy?.config)
      : standard()

  function scheduleFlush(): void {
    if (flushing) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      flushing = true
      buffer = await flushQueue(
        {
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
        },
        buffer
      )
      flushing = false

      if (buffer.todo > 0) {
        scheduleFlush()
      }
    }, Math.random() * 5000)
  }

  async function send(ctx: Context): Promise<Context> {
    if (isOffline()) {
      buffer.push(ctx)
      scheduleFlush()
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
  }

  return {
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
}
