import { ChangedProperties } from '@segment/analytics-signals-runtime'
import {
  URLChangeObservable,
  URLChangeObservableSettings,
} from '../../../lib/detect-url-change'
import { createNavigationSignal } from '../../../types/factories'
import { SignalEmitter } from '../../emitter'
import { SignalGenerator } from '../types'

function getURLDifferences(url1: URL, url2: URL): ChangedProperties[] {
  const changed: ChangedProperties[] = []
  const propertiesToCompare: (keyof URL)[] = [
    'href',
    'protocol',
    'host',
    'hostname',
    'port',
    'pathname',
    'search',
    'hash',
    'username',
    'password',
  ]

  for (const property of propertiesToCompare) {
    if (url1[property] !== url2[property]) {
      if (property === 'pathname') {
        changed.push('path')
      }
      if (['search', 'hash'].includes(property)) {
        changed.push(property as ChangedProperties)
      }
    }
  }

  return changed
}

export class OnNavigationEventGenerator implements SignalGenerator {
  id = 'navigation'

  urlChange: URLChangeObservable
  constructor(settings: URLChangeObservableSettings) {
    this.urlChange = new URLChangeObservable(settings)
  }

  register(emitter: SignalEmitter): () => void {
    // emit navigation signal on page load
    emitter.emit(
      createNavigationSignal({
        action: 'pageLoad',
        ...this.createCommonFields(),
      })
    )

    // emit a navigation signal whenever the URL has changed
    this.urlChange.subscribe(({ previous, current }) =>
      emitter.emit(
        createNavigationSignal({
          action: 'urlChange',
          prevUrl: previous.href,
          changedProperties: getURLDifferences(current, previous),
          ...this.createCommonFields(),
        })
      )
    )

    return () => {
      urlChange.unsubscribe()
    }
  }

  private createCommonFields() {
    return {
      // these fields are named after those from the page call, rather than a DOM api.
      url: location.href,
      path: location.pathname,
      hash: location.hash,
      search: location.search,
      title: document.title,
    }
  }
}
