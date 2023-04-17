import { pick } from '../../lib/pick'
import type { Context } from '../../core/context'
import type { Plugin } from '../../core/plugin'

interface PageDefault {
  [key: string]: unknown
  path: string
  referrer: string
  search: string
  title: string
  url: string
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

function enrichPageContext(ctx: Context): Context {
  const event = ctx.event
  event.context = event.context || {}

  const defaultPageContext = pageDefaults()

  const pageContextFromEventProps =
    event.properties && pick(event.properties, Object.keys(defaultPageContext))

  event.context.page = {
    ...defaultPageContext,
    ...pageContextFromEventProps,
    ...event.context.page,
  }

  if (event.type === 'page') {
    event.properties = {
      ...defaultPageContext,
      ...event.properties,
      ...(event.name ? { name: event.name } : {}),
    }
  }

  return ctx
}

export const pageEnrichment: Plugin = {
  name: 'Page Enrichment',
  version: '0.1.0',
  isLoaded: () => true,
  load: () => Promise.resolve(),
  type: 'before',
  page: enrichPageContext,
  alias: enrichPageContext,
  track: enrichPageContext,
  identify: enrichPageContext,
  group: enrichPageContext,
}
