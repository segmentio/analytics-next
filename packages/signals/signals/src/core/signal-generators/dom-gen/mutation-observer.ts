import { Emitter } from '@segment/analytics-generic-utils'

const roleAttributesMap = {
  button: ['aria-pressed', 'aria-disabled'],
  checkbox: ['aria-checked', 'aria-disabled'],
  combobox: ['aria-expanded', 'aria-activedescendant', 'aria-controls'],
  dialog: ['aria-modal'],
  gridcell: ['aria-selected'],
  link: ['aria-expanded'],
  listbox: ['aria-activedescendant'],
  option: ['aria-selected'],
  radio: ['aria-checked'],
  scrollbar: ['aria-valuenow'],
  slider: ['aria-valuenow'],
  spinbutton: ['aria-valuenow'],
  switch: ['aria-checked'],
  tab: ['aria-selected'],
  textbox: ['aria-invalid'],
  treeitem: ['aria-expanded', 'aria-selected'],
}

const defaultElementAttributesMap = {
  input: ['value'],
  option: ['value'],
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

export class InteractableElementMutationObserver {
  // Track observed elements to avoid duplicate observers
  private observedElements = new WeakSet()
  private emitter = new ElementChangedEmitter()
  subscribe(fn: (event: AttributeChangedEvent) => void) {
    this.emitter.on('attributeChanged', fn)
  }
  constructor() {
    // Start polling every 2 seconds
    setInterval(() => this.pollForNewElements(this.emitter), 2000)

    // Initial setup
    this.pollForNewElements(this.emitter)
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

          const event: AttributeChangedEvent = {
            element: element as HTMLElement,
            attributeName,
            newValue,
          }
          emitter.emit('attributeChanged', event)
        }
      }
    })

    observer.observe(element, {
      attributes: true,
      attributeFilter: attributes,
      subtree: false,
    })

    this.observedElements.add(element)
  }

  private pollForNewElements(emitter: ElementChangedEmitter) {
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
