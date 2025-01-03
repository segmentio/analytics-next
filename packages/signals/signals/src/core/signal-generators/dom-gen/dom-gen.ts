import { URLChangeObservable } from '../../../lib/detect-url-change'
import {
  createInteractionSignal,
  createNavigationSignal,
} from '../../../types/factories'
import { SignalEmitter } from '../../emitter'
import { SignalGenerator } from '../types'
import { cleanText } from './helpers'
import type { ParsedAttributes } from '@segment/analytics-signals-runtime'

interface Label {
  textContent: string
  id: string
  attributes: ParsedAttributes
}

const parseFormData = (data: FormData): Record<string, string> => {
  return [...data].reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, string>)
}

const parseLabels = (
  labels: NodeListOf<HTMLLabelElement> | null | undefined
): Label[] => {
  if (!labels) return []
  return [...labels].map(parseToLabel).filter((el): el is Label => Boolean(el))
}

const parseToLabel = (label: HTMLElement): Label => {
  const textContent = label.textContent ? cleanText(label.textContent) : ''
  return {
    id: label.id,
    attributes: parseNodeMap(label.attributes),
    textContent,
  }
}

const parseNodeMap = (nodeMap: NamedNodeMap): ParsedAttributes => {
  return Array.from(nodeMap).reduce<ParsedAttributes>((acc, attr) => {
    acc[attr.name] = attr.value
    return acc
  }, {})
}

interface ParsedElementBase {
  /**
   * The attributes of the element -- this is a key-value object of the attributes of the element
   */
  attributes: ParsedAttributes
  classList: string[]
  id: string
  /**
   * The labels associated with this element -- either from the `labels` property or from the `aria-labelledby` attribute
   */
  labels?: Label[]
  /**
   * The first label associated with this element -- either from the `labels` property or from the `aria-labelledby` attribute
   */
  label?: Label
  name?: string
  nodeName: string
  tagName: string
  title: string
  type?: string

  /**
   * The value of the element -- for inputs, this is the value of the input, for selects, this is the value of the selected option
   */
  value?: string
  /**
   * The value content of the element -- this is the value content of the element, stripped of newlines, tabs, and multiple spaces
   */
  textContent?: string
  /**
   * The inner value of the element -- this is the value content of the element, stripped of newlines, tabs, and multiple spaces
   */
  innerText?: string
  /**
   * The element referenced by the `aria-describedby` attribute
   */
  describedBy?: Label
}

interface ParsedSelectElement extends ParsedElementBase {
  selectedOptions: { label: string; value: string }[]
  selectedIndex: number
}
interface ParsedInputElement extends ParsedElementBase {
  checked: boolean
}
interface ParsedMediaElement extends ParsedElementBase {
  currentSrc?: string
  currentTime?: number
  duration: number
  ended: boolean
  muted: boolean
  paused: boolean
  playbackRate: number
  readyState?: number
  src?: string
  volume?: number
}

interface ParsedHTMLFormElement extends ParsedElementBase {
  formData: Record<string, string>
  innerText: never
  textContent: never
}

type AnyParsedElement =
  | ParsedHTMLFormElement
  | ParsedSelectElement
  | ParsedInputElement
  | ParsedMediaElement
  | ParsedElementBase

/**
 * Get the element referenced from an type
 */
const getReferencedElement = (
  el: HTMLElement,
  attr: string
): HTMLElement | undefined => {
  const value = el.getAttribute(attr)
  if (!value) return undefined
  return document.getElementById(value) ?? undefined
}

export const parseElement = (el: HTMLElement): AnyParsedElement => {
  const labels = parseLabels((el as HTMLInputElement).labels)
  const labeledBy = getReferencedElement(el, 'aria-labelledby')
  const describedBy = getReferencedElement(el, 'aria-describedby')
  if (labeledBy) {
    const label = parseToLabel(labeledBy)
    labels.unshift(label)
  }
  const base: ParsedElementBase = {
    // adding a bunch of fields that are not on _all_ elements, but are on enough that it's useful to have them here.
    attributes: parseNodeMap(el.attributes),
    classList: [...el.classList],
    id: el.id,
    labels,
    label: labels[0],
    name: (el as HTMLInputElement).name,
    nodeName: el.nodeName,
    tagName: el.tagName,
    title: el.title,
    type: (el as HTMLInputElement).type,
    value: (el as HTMLInputElement).value,
    textContent: (el.textContent && cleanText(el.textContent)) ?? undefined,
    innerText: (el.innerText && cleanText(el.innerText)) ?? undefined,
    describedBy: (describedBy && parseToLabel(describedBy)) ?? undefined,
  }

  if (el instanceof HTMLSelectElement) {
    return {
      ...base,
      selectedOptions: [...el.selectedOptions].map((option) => ({
        value: option.value,
        label: option.label,
      })),
      selectedIndex: el.selectedIndex,
    }
  } else if (el instanceof HTMLInputElement) {
    return {
      ...base,
      checked: el.checked,
    }
  } else if (el instanceof HTMLMediaElement) {
    return {
      ...base,
      currentSrc: el.currentSrc,
      currentTime: el.currentTime,
      duration: el.duration,
      ended: el.ended,
      muted: el.muted,
      paused: el.paused,
      playbackRate: el.playbackRate,
      readyState: el.readyState,
      src: el.src,
      volume: el.volume,
    }
  } else if (el instanceof HTMLFormElement) {
    return {
      ...base,
      innerText: undefined,
      textContent: undefined,
      formData: parseFormData(new FormData(el)),
    }
  }
  return base
}

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
    urlChange.subscribe((prevUrl) =>
      emitter.emit(
        createNavigationSignal({
          action: 'urlChange',
          prevUrl,
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
