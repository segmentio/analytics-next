import jar from 'js-cookie'
import { pick } from '../../lib/pick'
import type { Context } from '../../core/context'
import type { Plugin } from '../../core/plugin'
import { version } from '../../generated/version'
import { SegmentEvent } from '../../core/events'
import { Campaign, EventProperties, PluginType } from '@segment/analytics-core'
import { getVersionType } from '../../lib/version-type'
import { tld } from '../../core/user/tld'
import { gracefulDecodeURIComponent } from '../../core/query-string/gracefulDecodeURIComponent'
import { CookieStorage, UniversalStorage } from '../../core/storage'
import { Analytics } from '../../core/analytics'

interface PageDefault {
  [key: string]: unknown
  path: string
  referrer: string
  search: string
  title: string
  url: string
}

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

/**
 * Get the current page's canonical URL.
 */
function canonical(): string | undefined {
  const canon = document.querySelector("link[rel='canonical']")
  if (canon) {
    return canon.getAttribute('href') || undefined
  }
}

/**
 * Return the canonical path for the page.
 */

function canonicalPath(): string {
  const canon = canonical()
  if (!canon) {
    return window.location.pathname
  }

  const a = document.createElement('a')
  a.href = canon
  const pathname = !a.pathname.startsWith('/') ? '/' + a.pathname : a.pathname

  return pathname
}

/**
 * Return the canonical URL for the page concat the given `search`
 * and strip the hash.
 */

export function canonicalUrl(search = ''): string {
  const canon = canonical()
  if (canon) {
    return canon.includes('?') ? canon : `${canon}${search}`
  }
  const url = window.location.href
  const i = url.indexOf('#')
  return i === -1 ? url : url.slice(0, i)
}

/**
 * Return a default `options.context.page` object.
 *
 * https://segment.com/docs/spec/page/#properties
 */

export function pageDefaults(): PageDefault {
  return {
    path: canonicalPath(),
    referrer: document.referrer,
    search: location.search,
    title: document.title,
    url: canonicalUrl(location.search),
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
      let utmParam = k.substr(4) as keyof Campaign
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

class PageEnrichmentPlugin implements Plugin {
  private instance!: Analytics

  name = 'Page Enrichment'
  type: PluginType = 'before'
  version = '0.1.0'
  isLoaded = () => true
  load = (_ctx: Context, instance: Analytics) => {
    this.instance = instance
    return Promise.resolve()
  }

  private enrich = (ctx: Context): Context => {
    const event = ctx.event
    const evtCtx = (event.context ??= {})

    const defaultPageContext = pageDefaults()

    let pageContextFromEventProps: Pick<EventProperties, string> | undefined

    if (event.type === 'page') {
      pageContextFromEventProps =
        event.properties &&
        pick(event.properties, Object.keys(defaultPageContext))

      event.properties = {
        ...defaultPageContext,
        ...event.properties,
        ...(event.name ? { name: event.name } : {}),
      }
    }

    evtCtx.page = {
      ...defaultPageContext,
      ...pageContextFromEventProps,
      ...evtCtx.page,
    }

    const query: string = evtCtx.page.search || ''

    evtCtx.userAgent = navigator.userAgent

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

    return ctx
  }

  track = this.enrich
  identify = this.enrich
  page = this.enrich
  group = this.enrich
  alias = this.enrich
  screen = this.enrich
}

export const pageEnrichment = new PageEnrichmentPlugin()
