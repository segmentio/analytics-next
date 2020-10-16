import { Context } from '@/core/context'
import { Extension } from '@/core/extension'
import url from 'component-url'

/**
 * Get the current page's canonical URL.
 *
 * @return {string|undefined}
 */
function canonical(): string {
  const tags = document.getElementsByTagName('link')

  Array.from(tags).forEach((tag) => {
    if (tag.getAttribute('rel') === 'canonical') {
      return tag.getAttribute('href')
    }
  })

  return ''
}

/**
 * Return the canonical path for the page.
 */

function canonicalPath(): string {
  const canon = canonical()
  if (!canon) {
    return window.location.pathname
  }
  const parsed = url.parse(canon)
  return parsed.pathname ?? ''
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

function pageDefaults(): object {
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
  event.context = event.context ?? {}
  const pageContext = event.context.page ?? pageDefaults()

  event.context = {
    page: pageContext,
    ...event.context,
  }

  ctx.event = event
  return ctx
}

export const pageEnrichment: Extension = {
  name: 'Page Enrichment',
  version: '0.1.0',
  isLoaded: () => true,
  load: () => Promise.resolve(),
  type: 'enrichment',

  page: async (ctx) => {
    // TODO: fix overrides
    ctx.event.properties = {
      ...ctx.event.properties,
      ...pageDefaults(),
    }

    return ctx
  },

  alias: async (ctx) => enrichPageContext(ctx),
  track: async (ctx) => enrichPageContext(ctx),
  identify: async (ctx) => enrichPageContext(ctx),
  group: async (ctx) => enrichPageContext(ctx),
}
