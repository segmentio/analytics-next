import { URLChangeObservable } from '../../lib/detect-url-change'
import { logger } from '../../lib/logger'
import {
  createInteractionSignal,
  createNavigationSignal,
} from '../../types/factories'
import { SignalEmitter } from '../emitter'
import { SignalGenerator } from './types'

interface Label {
  textContent: string
  id: string
  attributes: Record<string, unknown>
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
  return [...labels]
    .map((label) => ({
      id: label.id,
      attributes: parseNodeMap(label.attributes),
      textContent: label.textContent ? cleanText(label.textContent) : undefined,
    }))
    .filter((el): el is Label => Boolean(el.textContent))
}

const parseNodeMap = (nodeMap: NamedNodeMap): Record<string, unknown> => {
  return Array.from(nodeMap).reduce((acc, attr) => {
    acc[attr.name] = attr.value
    return acc
  }, {} as Record<string, unknown>)
}

export const cleanText = (str: string): string => {
  return str
    .replace(/[\r\n\t]+/g, ' ') // Replace newlines and tabs with a space
    .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with a regular space
    .trim() // Trim leading and trailing spaces
}

interface ParsedElementBase {
  attributes: Record<string, unknown>
  classList: string[]
  id: string
  labels?: Label[]
  label?: Label
  name?: string
  nodeName: string
  tagName: string
  title: string
  type?: string
  value?: string
  textContent?: string
  innerText?: string
}

interface ParsedSelectElement extends ParsedElementBase {
  selectedOptions: { value: string; text: string }[]
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

const parseElement = (el: HTMLElement): AnyParsedElement => {
  const labels = parseLabels((el as HTMLInputElement).labels)
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
  }

  if (el instanceof HTMLSelectElement) {
    return {
      ...base,
      selectedOptions: [...el.selectedOptions].map((option) => ({
        value: option.value,
        text: option.text,
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
    // if you click on a nested element, we want to get the closest clickable ancestor. Useful for things like buttons with nested text or images
    return el.closest<HTMLElement>('button, a, [role="button"], [role="link"]')
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

export class OnChangeGenerator implements SignalGenerator {
  id = 'change'
  register(emitter: SignalEmitter) {
    const handleChange = (ev: Event) => {
      const target = ev.target as HTMLElement | null
      if (!target) return
      if (target && target instanceof HTMLInputElement) {
        if (target.type === 'password') {
          logger.debug('Ignoring change event for input', target)
          return
        }
      }
      emitter.emit(
        createInteractionSignal({
          eventType: 'change',
          target: parseElement(target),
        })
      )
    }
    document.addEventListener('change', handleChange, true)
    return () => document.removeEventListener('change', handleChange)
  }
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

export const domGenerators = [
  ClickSignalsGenerator,
  FormSubmitGenerator,
  OnChangeGenerator,
  OnNavigationEventGenerator,
]
