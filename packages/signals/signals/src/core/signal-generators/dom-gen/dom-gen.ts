import { ChangedProperties } from '@segment/analytics-signals-runtime'
import { URLChangeObservable } from '../../../lib/detect-url-change'
import {
  createInteractionSignal,
  createNavigationSignal,
} from '../../../types/factories'
import { SignalEmitter } from '../../emitter'
import { SignalGenerator } from '../types'
import { parseElement } from './element-parser'

export class ClickSignalsGenerator implements SignalGenerator {
  id = 'click'

  register(emitter: SignalEmitter) {
    const handleClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null
      if (!target) return
      const el = this.getClosestClickableElement(target)
      if (el) {
        emitter.emit(
          createInteractionSignal({
            eventType: 'click',
            target: parseElement(el),
          })
        )
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick)
  }

  private getClosestClickableElement(el: HTMLElement): HTMLElement | null {
    // if you click on a nested element, we want to get the closest clickable ancestor. Useful for things like buttons with nested value or images
    const selector = [
      'button',
      'a',
      'option',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="menuitemcheckbox"]',
      '[role="menuitemradio"]',
      '[role="tab"]',
      '[role="option"]',
      '[role="switch"]',
      '[role="treeitem"]',
    ].join(', ')
    return el.closest<HTMLElement>(selector)
  }
}

export class FormSubmitGenerator implements SignalGenerator {
  id = 'form-submit'
  register(emitter: SignalEmitter) {
    const handleSubmit = (ev: SubmitEvent) => {
      const target = ev.target as HTMLFormElement | null

      if (!target) return

      // reference to the form element that the submit event is being fired at
      const submitter = ev.submitter
      // If the form is submitted via JavaScript using form.submit(), the submitter property will be null because no specific button/input triggered the submission.
      emitter.emit(
        createInteractionSignal({
          eventType: 'submit',
          target: parseElement(target),
          submitter: submitter ? parseElement(submitter) : undefined,
        })
      )
    }
    document.addEventListener('submit', handleSubmit, true)
    return () => document.removeEventListener('submit', handleSubmit)
  }
}

export const shouldIgnoreElement = (el: HTMLElement): boolean => {
  if (el instanceof HTMLInputElement) {
    return el.type === 'password'
  }
  return false
}

function getObjectDifferences<T extends object>(obj1: T, obj2: T): string[] {
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
  return Array.from(keys).filter(
    (key) => obj1[key as keyof T] !== obj2[key as keyof T]
  )
}

function getURLDifferences(current: URL, previous: URL): ChangedProperties[] {
  const difference = getObjectDifferences(current, previous)
  const changed: ChangedProperties[] = []
  for (const k of difference) {
    if (k === 'pathname') {
      changed.push('path')
    }
    if (['search', 'hash'].includes(k)) {
      changed.push(k as ChangedProperties)
    }
  }
  return changed
}

export class OnNavigationEventGenerator implements SignalGenerator {
  id = 'navigation'

  register(emitter: SignalEmitter): () => void {
    // emit navigation signal on page load
    emitter.emit(
      createNavigationSignal({
        action: 'pageLoad',
        ...this.createCommonFields(),
      })
    )

    // emit a navigation signal whenever the URL has changed
    const urlChange = new URLChangeObservable()
    urlChange.subscribe(({ previous, current }) =>
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
