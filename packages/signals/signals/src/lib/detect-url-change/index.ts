import { Emitter } from '@segment/analytics-generic-utils'

type ChangeData = {
  current: URL
  previous: URL
}
export interface URLChangeObservableSettings {
  pollInterval?: number
}

// This seems hacky, but if using react router (or other SPAs), popstate will not always fire on navigation
// Otherwise, we could use popstate / hashchange events
export class URLChangeObservable {
  private emitter = new Emitter<{ change: [ChangeData] }>()
  private pollInterval: number
  private urlChanged?: (data: ChangeData) => void
  constructor(settings: URLChangeObservableSettings = {}) {
    this.pollInterval = settings.pollInterval ?? 500
    this.pollURLChange()
  }

  private pollURLChange() {
    let prevUrl = window.location.href
    setInterval(() => {
      const currentUrl = window.location.href
      if (currentUrl != prevUrl) {
        const current = new URL(currentUrl)
        const prev = new URL(prevUrl)
        this.emitter.emit('change', {
          current,
          previous: prev,
        })
        prevUrl = currentUrl
      }
    }, this.pollInterval)
  }

  subscribe(urlChanged: (data: ChangeData) => void) {
    this.urlChanged = urlChanged
    this.emitter.on('change', this.urlChanged)
  }

  unsubscribe() {
    this.emitter.off('change', this.urlChanged!)
  }
}
