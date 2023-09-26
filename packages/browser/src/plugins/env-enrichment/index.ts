import jar from 'js-cookie'
import type { Context } from '../../core/context'
import type { Plugin } from '../../core/plugin'
import { version } from '../../generated/version'
import { SegmentEvent } from '../../core/events'
import { Campaign, PluginType } from '@segment/analytics-core'
import { getVersionType } from '../../lib/version-type'
import { tld } from '../../core/user/tld'
import { gracefulDecodeURIComponent } from '../../core/query-string/gracefulDecodeURIComponent'
import { CookieStorage, UniversalStorage } from '../../core/storage'
import { Analytics } from '../../core/analytics'
import { clientHints } from '../../lib/client-hints'
import { UADataValues } from '../../lib/client-hints/interfaces'

let cookieOptions: jar.CookieAttributes | undefined
function getCookieOptions(): jar.CookieAttributes {
  if (cookieOptions) {
    return cookieOptions
  }

  const domain = tld(window.location.href)
  cookieOptions = {
    expires: 31536000000, // 1 year
    secure: false,
    path: '/',
  }
  if (domain) {
    cookieOptions.domain = domain
  }

  return cookieOptions
}

type Ad = { id: string; type: string }

function ads(query: string): Ad | undefined {
  const queryIds: Record<string, string> = {
    btid: 'dataxu',
    urid: 'millennial-media',
  }

  if (query.startsWith('?')) {
    query = query.substring(1)
  }
  query = query.replace(/\?/g, '&')
  const parts = query.split('&')

  for (const part of parts) {
    const [k, v] = part.split('=')
    if (queryIds[k]) {
      return {
        id: v,
        type: queryIds[k],
      }
    }
  }
}

export function utm(query: string): Campaign {
  if (query.startsWith('?')) {
    query = query.substring(1)
  }
  query = query.replace(/\?/g, '&')

  return query.split('&').reduce((acc, str) => {
    const [k, v = ''] = str.split('=')
    if (k.includes('utm_') && k.length > 4) {
      let utmParam = k.slice(4) as keyof Campaign
      if (utmParam === 'campaign') {
        utmParam = 'name'
      }
      acc[utmParam] = gracefulDecodeURIComponent(v)
    }
    return acc
  }, {} as Campaign)
}

export function ampId(): string | undefined {
  const ampId = jar.get('_ga')
  if (ampId && ampId.startsWith('amp')) {
    return ampId
  }
}

function referrerId(
  query: string,
  ctx: SegmentEvent['context'],
  disablePersistance: boolean
): void {
  const storage = new UniversalStorage<{
    's:context.referrer': Ad
  }>(disablePersistance ? [] : [new CookieStorage(getCookieOptions())])

  const stored = storage.get('s:context.referrer')

  const ad = ads(query) ?? stored

  if (!ad) {
    return
  }

  if (ctx) {
    ctx.referrer = { ...ctx.referrer, ...ad }
  }

  storage.set('s:context.referrer', ad)
}

/**
 *
 * @param obj e.g. { foo: 'b', bar: 'd'}
 * @returns e.g. 'foo=b&bar=d'
 */
const objectToQueryString = (obj: Record<string, string>): string => {
  try {
    return new URLSearchParams(obj).toString()
  } catch {
    return ''
  }
}

class EnvironmentEnrichmentPlugin implements Plugin {
  private instance!: Analytics
  private userAgentData: UADataValues | undefined

  name = 'Page Enrichment'
  type: PluginType = 'before'
  version = '0.1.0'
  isLoaded = () => true
  load = async (_ctx: Context, instance: Analytics) => {
    this.instance = instance
    try {
      this.userAgentData = await clientHints(
        this.instance.options.highEntropyValuesClientHints
      )
    } catch (_) {
      // if client hints API doesn't return anything leave undefined
    }
    return Promise.resolve()
  }

  private enrich = (ctx: Context): Context => {
    const event = ctx.event
    const evtCtx = (event.context ??= {})

    const search = evtCtx.page!.search || ''
    const query =
      typeof search === 'object' ? objectToQueryString(search) : search

    evtCtx.userAgent = navigator.userAgent
    evtCtx.userAgentData = this.userAgentData

    // @ts-ignore
    const locale = navigator.userLanguage || navigator.language

    if (typeof evtCtx.locale === 'undefined' && typeof locale !== 'undefined') {
      evtCtx.locale = locale
    }

    evtCtx.library ??= {
      name: 'analytics.js',
      version: `${getVersionType() === 'web' ? 'next' : 'npm:next'}-${version}`,
    }

    if (query && !evtCtx.campaign) {
      evtCtx.campaign = utm(query)
    }

    const amp = ampId()
    if (amp) {
      evtCtx.amp = { id: amp }
    }

    referrerId(
      query,
      evtCtx,
      this.instance.options.disableClientPersistence ?? false
    )

    try {
      evtCtx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (_) {
      // If browser doesn't have support leave timezone undefined
    }

    return ctx
  }

  track = this.enrich
  identify = this.enrich
  page = this.enrich
  group = this.enrich
  alias = this.enrich
  screen = this.enrich
}

export const envEnrichment = new EnvironmentEnrichmentPlugin()
