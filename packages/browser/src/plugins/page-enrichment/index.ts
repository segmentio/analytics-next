// import { CoreExtraContext } from '@segment/analytics-core'
// import type { Context } from '../../core/context'
import { SegmentEvent } from '../../core/events'
// import type { Plugin } from '../../core/plugin'

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
 *
 * @return {string|undefined}
 */
function canonical(): string {
  const tags = document.getElementsByTagName('link')
  let canon: string | null = ''

  Array.prototype.slice.call(tags).forEach((tag) => {
    if (tag.getAttribute('rel') === 'canonical') {
      canon = tag.getAttribute('href')
    }
  })

  return canon
}

/**
 * Return the canonical path for the page.
 */

function canonicalPath(initWindow?: Window): string {
  const canon = canonical()
  if (!canon) {
    return initWindow ? initWindow.location.pathname : window.location.pathname
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

export function canonicalUrl(search = '', initWindow?: Window): string {
  const canon = canonical()
  if (canon) {
    return canon.includes('?') ? canon : `${canon}${search}`
  }
  const url = initWindow ? initWindow.location.href : window.location.href
  const i = url.indexOf('#')
  return i === -1 ? url : url.slice(0, i)
}

/**
 * Return a default `options.context.page` object.
 *
 * https://segment.com/docs/spec/page/#properties
 */

export function pageDefaults(initWindow?: Window): PageDefault {
  return {
    path: canonicalPath(initWindow),
    referrer: initWindow ? initWindow.document.referrer : document.referrer,
    search: initWindow ? initWindow.location.search : location.search,
    title: initWindow ? initWindow.document.title : document.title,
    url: canonicalUrl(
      initWindow ? initWindow.location.search : location.search
    ),
  }
}

export function enrichPageContext(
  event: SegmentEvent,
  initWindow?: Window
): SegmentEvent {
  event.context = event.context || {}
  let pageContext = pageDefaults(initWindow)
  const pageProps = event.properties ?? {}

  Object.keys(pageContext).forEach((key) => {
    if (pageProps[key]) {
      pageContext[key] = pageProps[key]
    }
  })

  if (event.context.page) {
    pageContext = Object.assign({}, pageContext, event.context.page)
  }

  event.context = Object.assign({}, event.context, {
    page: pageContext,
  })

  return event
}

// export const pageEnrichment: Plugin = {
//   name: 'Page Enrichment',
//   version: '0.1.0',
//   isLoaded: () => true,
//   load: () => Promise.resolve(),
//   type: 'before',

//   page: (ctx) => {
//     ctx.event.properties = Object.assign(
//       {},
//       pageDefaults(),
//       ctx.event.properties
//     )

//     if (ctx.event.name) {
//       ctx.event.properties.name = ctx.event.name
//     }

//     return enrichPageContext(ctx)
//   },

//   alias: enrichPageContext,
//   track: enrichPageContext,
//   identify: enrichPageContext,
//   group: enrichPageContext,
// }
