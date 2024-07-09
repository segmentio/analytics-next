import { Emitter } from '@segment/analytics-generic-utils'

// This seems hacky, but if using react router (or other SPAs), popstate will not always fire on navigation
// Otherwise, we could use popstate / hashchange events
export class URLChangeObservable {
  private emitter = new Emitter()
  private pollInterval = 500
  urlChanged?: (url: string) => void
  constructor() {
    this.pollURLChange()
  }

  private pollURLChange() {
    let prevUrl = window.location.href
    setInterval(() => {
      const currentUrl = window.location.href
      if (currentUrl != prevUrl) {
        this.emitter.emit('change', prevUrl)
        prevUrl = currentUrl
      }
    }, this.pollInterval)
  }

  subscribe(urlChanged: (newURL: string) => void) {
    this.urlChanged = urlChanged
    this.emitter.on('change', this.urlChanged)
  }

  unsubscribe() {
    this.emitter.off('change', this.urlChanged!)
  }
}
