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
    if (typeof attr.value === 'string' || attr.value === null) {
      acc[attr.name] = attr.value
    }
    return acc
  }, {})
}

interface ParsedElementBase {
  attributes: ParsedAttributes
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

  const parsedAttributes = parseNodeMap(el.attributes)

  // This exists because of a bug in react-hook-form, where 'name', if used as the field registration name overrides the native element name value to reference itself.
  // This is a very weird scenario where a property was on the element, but not in the attributes map.
  // Only using this
  const getPropertyOrFallback = (prop: string): string | undefined => {
    if (!(prop in el)) {
      return undefined
    }
    // @ts-ignore
    const val = el[prop]
    return typeof val === 'string' ? val : undefined
  }

  const base: ParsedElementBase = {
    attributes: parsedAttributes,
    classList: [...el.classList],
    id: getPropertyOrFallback('id') || '',
    labels,
    label: labels[0],
    name: getPropertyOrFallback('name'),
    nodeName: el.nodeName,
    tagName: el.tagName,
    title: getPropertyOrFallback('title') || '',
    type: getPropertyOrFallback('type'),
    value: getPropertyOrFallback('value'),
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
