import { Emitter } from '@segment/analytics-generic-utils'

// string enum of roles
// map for Elements with <div role="button"> etc -- these map to a list of supported states and properties according to w3.org
const roleAttributesMap = {
  '*': ['aria-expanded', 'aria-errormessage'],
  button: ['aria-pressed'],
  checkbox: ['aria-checked'],
  combobox: ['aria-expanded', 'aria-activedescendant'],
  dialog: ['aria-modal'],
  gridcell: ['aria-selected'],
  link: ['aria-expanded'],
  listbox: ['aria-activedescendant'],
  menuitemcheckbox: ['aria-checked'],
  menuitemradio: ['aria-checked'],
  option: ['aria-selected'],
  radio: ['aria-checked'],
  scrollbar: ['aria-valuenow'],
  slider: ['aria-valuenow'],
  spinbutton: ['aria-valuenow'],
  switch: ['aria-checked'],
  tab: ['aria-selected'],
  textbox: ['aria-invalid'], // this isn't really a textbox, as we're not reading the content of the textbox, but the state of the textbox
  treeitem: ['aria-expanded', 'aria-selected'],
}

// map for default elements like <Button /> etc
const defaultElementAttributesMap = {
  input: ['value', 'checked'],
  label: ['data-selected'], // this was a checkbox in the react-aria library, so leaving this here. pretty strange.
  option: ['value', 'selected'],
  select: ['value'],
  textarea: ['value'],
}

type AttributeChangedEvent = {
  element: HTMLElement
  attributeName: string
  newValue: string | null
}
type EmitterContract = {
  attributeChanged: [AttributeChangedEvent]
}

class ElementChangedEmitter extends Emitter<EmitterContract> {}

export class ElementChangeObservable {
  // Track observed elements to avoid duplicate observers
  // WeakSet is used here to allow garbage collection of elements that are no longer in the DOM
  private observedElements = new WeakSet()
  private emitter = new ElementChangedEmitter()
  subscribe(fn: (event: AttributeChangedEvent) => void) {
    this.emitter.on('attributeChanged', fn)
  }
  constructor(pollIntervalMs = 2000) {
    if (pollIntervalMs < 500) {
      throw new Error('Poll interval must be at least 500ms')
    }
    // Initial setup
    this.checkForNewElements(this.emitter)

    // Start polling every 2 seconds
    setInterval(() => this.checkForNewElements(this.emitter))
  }

  private observeElementAttributes(
    element: Element,
    attributes: string[],
    emitter: ElementChangedEmitter
  ) {
    if (this.observedElements.has(element)) return // Skip if already observed

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes') {
          const attributeName = mutation.attributeName
          if (!attributeName) return
          const newValue = element.getAttribute(attributeName)
          if (newValue === null) {
            return console.warn('New value is null?', attributeName)
          }
          const event: AttributeChangedEvent = {
            element: element as HTMLElement,
            attributeName,
            // this is innacurate
            newValue,
          }
          emitter.emit('attributeChanged', event)
        }
      }
    })

    const allAttributes = [...roleAttributesMap['*'], ...attributes]
    observer.observe(element, {
      attributes: true,
      attributeFilter: allAttributes,
      subtree: false,
    })

    this.observedElements.add(element)
  }

  private checkForNewElements(emitter: ElementChangedEmitter) {
    // Observe elements with roles
    for (const [role, attributes] of Object.entries(roleAttributesMap)) {
      const elements = document.querySelectorAll(`[role="${role}"]`)
      elements.forEach((element) =>
        this.observeElementAttributes(element, attributes, emitter)
      )
    }

    // Observe default interactable elements
    for (const [tagName, attributes] of Object.entries(
      defaultElementAttributesMap
    )) {
      const elements = document.querySelectorAll(tagName)
      elements.forEach((element) =>
        this.observeElementAttributes(element, attributes, emitter)
      )
    }
  }
}
