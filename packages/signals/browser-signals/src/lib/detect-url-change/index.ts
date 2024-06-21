import { Emitter } from '@segment/analytics-generic-utils'

/**
 * this seems hacky, but if using react router (or other SPAs), popstate will not always fire on navigation
 * Otherwise, we could use popstate / hashchange events
 */
export class URLChangeEmitter extends Emitter {
  urlChanged?: (url: string) => void
  constructor() {
    super()
    const pollInterval = 500
    let prevUrl = ''
    setInterval(() => {
      const currentUrl = window.location.href
      if (currentUrl != prevUrl) {
        this.emit('change', currentUrl)
        prevUrl = currentUrl
      }
    }, pollInterval)
  }

  subscribe(urlChanged: (url: string) => void) {
    this.urlChanged = urlChanged
    this.on('change', this.urlChanged)
  }

  unsubscribe() {
    this.off('change', this.urlChanged!)
  }
}
