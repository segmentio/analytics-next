import { Facade } from '@segment/facade'
import { Analytics } from '../../analytics'
import { LegacySettings } from '../../browser'
import { Context, ContextCancelation } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { toFacade } from '../../lib/to-facade'
import standard from './fetch-dispatcher'
import batch from './batched-dispatcher'
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
  const apiHost = settings?.apiHost ?? 'api.segment.io/v1'
  const remote = `https://${apiHost}`

  const client =
    settings?.deliveryStrategy?.strategy === 'batching'
      ? batch(apiHost, settings?.deliveryStrategy?.config)
      : standard()

  async function send(ctx: Context): Promise<Context> {
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
      .catch((e) => {
        if (e.message === 'Failed to fetch' || e.type === 'error') {
          ctx.cancel(
            new ContextCancelation({
              retry: true,
              reason: `Event ${
                ctx.event.name ?? ''
              } failed. No internet connection.`,
              type: 'no_internet_connection',
            })
          )
        }

        return ctx
      })
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
