import { Analytics } from '../analytics'
import { SegmentEvent } from '../core/events'

declare global {
  interface Window {
    jQuery: any
    Zepto: any
  }
}

// Check if a user is opening the link in a new tab
function userNewTab(event: Event): boolean {
  // @ts-ignore -- typescript doesn't recognize that elements/events can have these properties
  if (event.ctrlKey || event.shiftKey || event.metaKey || (event.button && event.button == 1)) {
    return true
  }
  return false
}

// Check if the link opens in new tab
function linkNewTab(element: HTMLAnchorElement, href: string | null): boolean {
  if (element.target === '_blank' && href) {
    return true
  }
  return false
}

export async function link(
  this: Analytics,
  links: Element | Array<Element> | JQuery | null,
  event: string | Function,
  properties?: SegmentEvent['properties'] | Function
): Promise<Analytics> {
  let elements: Array<Element> = []
  // always arrays, handles jquery
  if (!links) {
    return this
  }
  if (links instanceof Element) {
    elements = [links]
  } else if ('toArray' in links) {
    elements = links.toArray()
  } else {
    elements = links
  }

  elements.forEach((el: Element) => {
    el.addEventListener(
      'click',
      (elementEvent: Event) => {
        const ev = event instanceof Function ? event(el) : event
        const props = properties instanceof Function ? properties(el) : properties
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || el.getAttribute('xlink:href')

        if (!linkNewTab(el as HTMLAnchorElement, href) && !userNewTab(elementEvent)) {
          elementEvent.preventDefault ? elementEvent.preventDefault() : (elementEvent.returnValue = false)
          // if a link is opening in the same tab, wait 300ms to give the track call time to complete
          setTimeout(() => {
            window.location.href = href!
          }, 300)
        }

        this.track(ev, props).catch(console.error)
      },
      false
    )
  })

  return this
}

export async function form(
  this: Analytics,
  forms: HTMLFormElement | Array<HTMLFormElement>,
  event: string | Function,
  properties?: SegmentEvent['properties'] | Function
): Promise<Analytics> {
  // always arrays, handles jquery
  if (forms instanceof HTMLFormElement) forms = [forms]

  const elements = forms

  elements.forEach((el) => {
    if (!(el instanceof Element)) throw new TypeError('Must pass HTMLElement to trackForm/trackSubmit.')
    const handler = async (elementEvent: Event): Promise<void> => {
      elementEvent.preventDefault ? elementEvent.preventDefault() : (elementEvent.returnValue = false)

      const ev = event instanceof Function ? event(el) : event
      const props = properties instanceof Function ? properties(el) : properties
      this.track(ev, props).catch(console.error)

      setTimeout(() => {
        el.submit()
      }, 300)
    }

    // Support the events happening through jQuery or Zepto instead of through
    // the normal DOM API, because `el.submit` doesn't bubble up events...
    const $ = window.jQuery || window.Zepto
    if ($) {
      $(el).submit(handler)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      el.addEventListener('submit', handler, false)
    }
  })

  return this
}
