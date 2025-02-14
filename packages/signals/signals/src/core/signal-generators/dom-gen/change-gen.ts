import { logger } from '../../../lib/logger'
import { createInteractionSignal } from '../../../types/factories'
import { SignalEmitter } from '../../emitter'
import { SignalGlobalSettings } from '../../signals'
import { SignalGenerator } from '../types'
import { shouldIgnoreElement } from './dom-gen'
import { parseElement } from './element-parser'
import {
  MutationObservable,
  AttributeChangedEvent,
  MutationObservableSettings,
} from './mutation-observer'

export class MutationGeneratorSettings extends MutationObservableSettings {}

export class MutationChangeGenerator implements SignalGenerator {
  id = 'mutation'
  private elMutObserver: MutationObservable
  /**
   * Custom selectors that should be ignored by the mutation observer
   * e.g if you have a custom input field that is not a standard input field, you can add it here
   */
  customSelectors = []
  constructor(settings: SignalGlobalSettings) {
    this.elMutObserver = new MutationObservable(settings.mutationGenerator)
  }

  register(emitter: SignalEmitter) {
    const callback = (ev: AttributeChangedEvent) => {
      const target = ev.element as HTMLElement | null
      if (!target || shouldIgnoreElement(target)) {
        return
      }
      const el = parseElement(ev.element)
      emitter.emit(
        createInteractionSignal({
          eventType: 'change',
          target: el,
          listener: 'mutation',
          change: ev.attributes,
        })
      )
    }
    this.elMutObserver.subscribe(callback)
    return () => this.elMutObserver.cleanup()
  }
}

export class OnChangeGenerator implements SignalGenerator {
  id = 'change'

  register(emitter: SignalEmitter) {
    /**
     * Magic attributes that we use to normalize the API between the mutation listener
     * and the onchange listener
     */
    type ChangedEvent = {
      checked?: boolean
      value?: string
      files?: string[]
      selectedOptions?: { label: string; value: string }[]
    }

    /**
     * Extract the change from a change event for stateless elistener lements,
     * so we can normalize the response between mutation listener changes and onchange listener events
     */
    const parseChange = (target: HTMLElement): ChangedEvent | undefined => {
      if (target instanceof HTMLSelectElement) {
        return {
          selectedOptions: Array.from(target.selectedOptions).map((option) => ({
            value: option.value,
            label: option.label,
          })),
        }
      }
      if (target instanceof HTMLTextAreaElement) {
        return { value: target.value }
      }
      if (target instanceof HTMLInputElement) {
        if ('value' in target || 'checked' in target) {
          if (target.type === 'checkbox' || target.type === 'radio') {
            return { checked: target.checked }
          }
          if (target.type === 'file') {
            return {
              files: Array.from(target.files ?? []).map((f) => f.name),
            }
          }
          return { value: target.value }
        }
      }
    }
    const isHandledByMutationObserver = (el: HTMLElement): boolean => {
      // check if the element is stateful -- if it is, we should ignore the onchange event since the mutation observer will pick it up
      // input fields where can modify the field through interactions:
      const inputTypesWithMutableValue = [
        'text',
        'password',
        'email',
        'url',
        'tel',
        'number',
        'search',
        'date',
        'time',
        'datetime-local',
        'month',
        'week',
        'color',
        'range',
      ]
      const type = el.getAttribute('type')
      const isInput = el instanceof HTMLInputElement
      if (
        isInput &&
        (type === null || inputTypesWithMutableValue.includes(type))
      ) {
        return el.getAttribute('value') !== null
      }
      return false
    }

    // vanilla change events do not trigger dom updates.
    const handleOnChangeEvent = (ev: Event) => {
      const target = ev.target as HTMLElement | null
      if (!target || shouldIgnoreElement(target)) {
        return
      }
      // if the element is an input with a value, we can use mutation observer to get the new value, so we don't send duplicate signals
      // this can really only happen with inputs, so we don't need to check for other elements
      // This is very hacky -- onChange has different semantics than the value mutation (onchange event only fires when the element loses focus), so it's not a perfect match.
      // We're not sure what the tolerance for duplicate-ish signals is since we have both strategies available?
      if (isHandledByMutationObserver(target)) {
        logger.debug('Ignoring onchange event in stateful element', target)
        return
      }

      const el = parseElement(target)
      const change = parseChange(target)
      if (!change) {
        logger.debug(
          'No change found on element..., this should not happen',
          el
        )
        return
      }
      emitter.emit(
        createInteractionSignal({
          eventType: 'change',
          listener: 'onchange',
          target: el,
          change,
        })
      )
    }

    document.addEventListener('change', handleOnChangeEvent, true)
    return () => {
      document.removeEventListener('change', handleOnChangeEvent, true)
    }
  }
}

export class ContentEditableChangeGenerator implements SignalGenerator {
  id = 'contenteditable'
  register(emitter: SignalEmitter) {
    const commitChange = (ev: Event) => {
      if (!(ev.target instanceof HTMLElement)) {
        return
      }
      const target = ev.target as HTMLElement
      const el = parseElement(target)
      emitter.emit(
        createInteractionSignal({
          eventType: 'change',
          listener: 'contenteditable',
          target: el,
          change: {
            textContent: el.textContent || null,
          },
        })
      )
    }

    const handleContentEditableChange = (ev: Event) => {
      const target = ev.target as HTMLElement | null
      const editable = target instanceof HTMLElement && target.isContentEditable
      if (!editable) {
        return
      }

      // normalize so this behaves like a change event on an input field -- so it doesn't fire on every keystroke.
      target.addEventListener('blur', commitChange, { once: true })
    }
    document.addEventListener('input', handleContentEditableChange, true)

    return () =>
      document.removeEventListener('input', handleContentEditableChange)
  }
}
