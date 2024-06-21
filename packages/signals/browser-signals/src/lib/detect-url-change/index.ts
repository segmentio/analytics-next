import { Emitter } from '@segment/analytics-generic-utils'

/**
 * this seems hacky, but if using react router (or other SPAs), popstate will not always fire on navigation
 * Otherwise, we could use popstate / hashchange events
 */
export class URLChangeEmitter {
  private emitter = new Emitter()
  urlChanged?: (url: string) => void
  constructor() {
    const pollInterval = 500
    let prevUrl = ''
    setInterval(() => {
      const currentUrl = window.location.href
      if (currentUrl != prevUrl) {
        this.emitter.emit('change', currentUrl)
        prevUrl = currentUrl
      }
    }, pollInterval)
  }

  subscribe(urlChanged: (url: string) => void) {
    this.urlChanged = urlChanged
    this.emitter.on('change', this.urlChanged)
  }

  unsubscribe() {
    this.emitter.off('change', this.urlChanged!)
  }
}
