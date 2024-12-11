import { Emitter } from '@segment/analytics-generic-utils'
import { exists } from '../../../lib/exists'
import { debounceWithKey } from '../../../lib/debounce'

const DEFAULT_OBSERVED_ATTRIBUTES = [
  'aria-pressed',
  'aria-checked',
  'aria-modal',
  'aria-selected',
  'value',
  'checked',
  'data-selected',
]
const DEFAULT_OBSERVED_TAGS = ['input', 'label', 'option', 'select', 'textarea']
const DEFAULT_OBSERVED_ROLES = [
  'button',
  'checkbox',
  'dialog',
  'gridcell',
  'row',
  'searchbox',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'scrollbar',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'treeitem',
]

type AttributeMutation = {
  attributeName: string
  newValue: string | null
}
export type AttributeChangedEvent = {
  element: HTMLElement
  attributes: AttributeMutation[]
}

export interface MutationObservableSettingsConfig {
  extraSelectors?: string[]
  pollIntervalMs?: number
  debounceMs?: number
  emitInputStrategy?: 'debounce-only' | 'blur' // the blur strategy seems to have an issue where it does not alwaus register when the page loads? It's also pretty finicky / manual.
  observedRoles?: (defaultObservedRoles: string[]) => string[]
  observedTags?: (defaultObservedTags: string[]) => string[]
  observedAttributes?: (defaultObservedAttributes: string[]) => string[]
}

export class MutationObservableSettings {
  pollIntervalMs: number
  debounceTextInputMs: number
  emitInputStrategy: 'debounce-only' | 'blur'
  extraSelectors: string[]
  observedRoles: string[]
  observedTags: string[]
  observedAttributes: string[]
  constructor(config: MutationObservableSettingsConfig = {}) {
    const {
      pollIntervalMs = 400,
      debounceMs = 1000,
      emitInputStrategy = 'debounce-only',
      extraSelectors = [],
      observedRoles,
      observedTags,
      observedAttributes,
    } = config
    if (pollIntervalMs < 300) {
      throw new Error('Poll interval must be at least 300ms')
    }
    if (debounceMs < 100) {
      throw new Error('Debounce must be at least 100ms')
    }
    this.emitInputStrategy = emitInputStrategy
    this.pollIntervalMs = pollIntervalMs
    this.debounceTextInputMs = debounceMs
    this.extraSelectors = extraSelectors

    this.observedRoles = observedRoles
      ? observedRoles(DEFAULT_OBSERVED_ROLES)
      : DEFAULT_OBSERVED_ROLES
    this.observedTags = observedTags
      ? observedTags(DEFAULT_OBSERVED_TAGS)
      : DEFAULT_OBSERVED_TAGS
    this.observedAttributes = observedAttributes
      ? observedAttributes(DEFAULT_OBSERVED_ATTRIBUTES)
      : DEFAULT_OBSERVED_ATTRIBUTES
  }
}

const shouldDebounce = (el: HTMLElement): boolean => {
  const MUTABLE_INPUT_TYPES = new Set([
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
    null, // same as 'text'
  ])

  const ROLES = new Set(['spinbutton'])
  const isInput =
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement

  const isContentEditable = el.isContentEditable
  if (isContentEditable) {
    return true
  }
  if (!isInput) {
    return false
  }

  const type = el.getAttribute('type')
  if (MUTABLE_INPUT_TYPES.has(type)) {
    return true
  }
  const role = el.getAttribute('role')
  if (role && ROLES.has(role)) {
    return true
  }
  return false
}

/**
 * This class is responsible for observing changes to elements in the DOM
 * This is preferred over monitoring document 'change' events, as it captures changes to custom elements
 */
export class MutationObservable {
  private settings: MutationObservableSettings
  // Track observed elements to avoid duplicate observers
  // WeakSet is used here to allow garbage collection of elements that are no longer in the DOM
  private observedElements = new WeakSet()
  private emitter = new ElementChangedEmitter()
  private listeners = new Set<(event: AttributeChangedEvent) => void>()

  subscribe(fn: (event: AttributeChangedEvent) => void) {
    this.listeners.add(fn)
    this.emitter.on('attributeChanged', fn)
  }

  cleanup() {
    this.listeners.forEach((fn) => this.emitter.off('attributeChanged', fn))
    this.listeners.clear()
    clearInterval(this.pollTimeout)
  }

  private pollTimeout: ReturnType<typeof setTimeout>

  constructor(
    settings: MutationObservableSettingsConfig | MutationObservableSettings = {}
  ) {
    this.settings =
      settings instanceof MutationObservableSettings
        ? settings
        : new MutationObservableSettings(settings)

    this.checkForNewElements(this.emitter)

    this.pollTimeout = setInterval(
      () => this.checkForNewElements(this.emitter),
      this.settings.pollIntervalMs
    )
  }

  private shouldEmitEvent(mut: AttributeMutation): boolean {
    // Filter out aria-selected events where the new value is false, since there will always be another selected value -- otherwise, checked would/should be used
    if (mut.attributeName === 'aria-selected' && mut.newValue === 'false') {
      return false
    }
    return true
  }

  private experimentalOnChangeAdapter = new ExperimentalOnChangeEventAdapter()

  private observeElementAttributes(
    element: HTMLElement,
    attributes: string[],
    emitter: ElementChangedEmitter
  ) {
    const _emitAttributeMutationEvent = (attributes: AttributeMutation[]) => {
      emitter.emit('attributeChanged', {
        element,
        attributes,
      })
    }
    const addOnBlurListener = (attributeMutations: AttributeMutation[]) =>
      this.experimentalOnChangeAdapter.onBlur(element, () =>
        _emitAttributeMutationEvent(attributeMutations)
      )

    const emit =
      this.settings.emitInputStrategy === 'blur'
        ? addOnBlurListener
        : _emitAttributeMutationEvent

    const _emitAttributeMutationEventDebounced = shouldDebounce(element)
      ? debounceWithKey(
          emit,
          // debounce based on the attribute names, so that we can debounce all changes to a single attribute. e.g if attribute "value" changes, that gets debounced, but if another attribute changes, that gets debounced separately
          (m) => Object.keys(m.map((m) => m.attributeName)).sort(),
          this.settings.debounceTextInputMs
        )
      : _emitAttributeMutationEvent

    const cb: MutationCallback = (mutationsList) => {
      const attributeMutations = mutationsList
        .filter((m) => m.type === 'attributes')
        .map((m) => {
          const attributeName = m.attributeName
          if (!attributeName) return
          const newValue = element.getAttribute(attributeName)
          const v: AttributeMutation = {
            attributeName,
            newValue: newValue,
          }
          return v
        })
        .filter(exists)
        .filter((event) => this.shouldEmitEvent(event))

      if (attributeMutations.length) {
        _emitAttributeMutationEventDebounced(attributeMutations)
      }
    }

    const observer = new MutationObserver(cb)

    observer.observe(element, {
      attributes: true,
      attributeFilter: attributes,
      subtree: false,
    })

    this.observedElements.add(element)
  }

  private checkForNewElements(emitter: ElementChangedEmitter) {
    const allElementSelectors = [
      ...this.settings.observedRoles.map((role) => `[role="${role}"]`),
      ...this.settings.observedTags,
      ...this.settings.extraSelectors,
    ]
    allElementSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach((element) => {
        if (this.observedElements.has(element)) {
          return
        }
        this.observeElementAttributes(
          element as HTMLElement,
          this.settings.observedAttributes,
          emitter
        )
      })
    })
  }
}

/**
 * This class is responsible for normalizing listener behavior so that events are only emitted once -- just like 'change' events
 */
class ExperimentalOnChangeEventAdapter {
  private inputListeners: Map<HTMLElement, EventListener> = new Map()
  private removeListener(element: HTMLElement) {
    const oldListener = this.inputListeners.get(element)
    if (oldListener) {
      element.removeEventListener('blur', oldListener)
    }
  }
  onBlur(element: HTMLElement, cb: () => void) {
    this.removeListener(element)
    element.addEventListener('blur', cb, { once: true }) // once: true is important here, otherwise we'd get duplicate events if someone clicks out of the input and then back in
    // on 'enter' keydown, we also want to emit the event
    element.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter') {
          cb()
        }
      },
      { once: true }
    )
    this.inputListeners.set(element, cb)
  }
}

type EmitterContract = {
  attributeChanged: [AttributeChangedEvent]
}
class ElementChangedEmitter extends Emitter<EmitterContract> {}
