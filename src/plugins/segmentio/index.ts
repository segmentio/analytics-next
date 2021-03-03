import { Facade } from '@segment/facade'
import fetch from 'unfetch'
import { Analytics } from '../../analytics'
import { LegacySettings } from '../../browser'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { toFacade } from '../../lib/to-facade'
import { normalize } from './normalize'

export interface SegmentioSettings {
  apiKey: string
  apiHost?: string
  addBundledMetadata?: boolean
  unbundledIntegrations?: string[]
  bundledConfigIds?: string[]
  unbundledConfigIds?: string[]
  crossDomainIdServers?: string[]
  saveCrossDomainIdInLocalStorage?: boolean
  deleteCrossDomainId?: boolean
  maybeBundledConfigIds?: Record<string, string[]>
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
  settings: SegmentioSettings,
  integrations: LegacySettings['integrations']
): Plugin {
  const remote = `https://${settings.apiHost ?? 'api.segment.io/v1'}`

  async function send(ctx: Context): Promise<Context> {
    const path = ctx.event.type.charAt(0)
    let json = toFacade(ctx.event).json()

    if (ctx.event.type === 'track') {
      delete json.traits
    }

    if (ctx.event.type === 'alias') {
      json = onAlias(analytics, json)
    }

    return fetch(`${remote}/${path}`, {
      headers: { 'Content-Type': 'text/plain' },
      method: 'post',
      body: JSON.stringify(normalize(analytics, json, settings, integrations)),
    }).then(() => ctx)
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
