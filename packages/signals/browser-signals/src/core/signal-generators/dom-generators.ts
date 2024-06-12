import { SignalEmitter } from '../emitter'
import { SignalGenerator } from './types'

interface Label {
  textContent?: string
}
const parseLabels = (
  labels: NodeListOf<HTMLLabelElement> | null | undefined
): Label[] => {
  if (!labels) return []
  return [...labels].map((label) => ({
    textContent: label.textContent ?? undefined,
  }))
}

const parseElement = (el: HTMLElement) => {
  const base = {
    // adding a bunch of fields that are not on _all_ elements, but are on enough that it's useful to have them here.
    attributes: [...el.attributes].map((attr) => ({
      name: attr.name,
      value: attr.value,
    })),
    classList: [...el.classList],
    id: el.id,
    labels: parseLabels((el as HTMLInputElement).labels),
    name: (el as HTMLInputElement).name,
    nodeName: el.nodeName,
    nodeType: el.nodeType,
    nodeValue: el.nodeValue,
    tagName: el.tagName,
    title: el.title,
    type: (el as HTMLInputElement).type,
    value: (el as HTMLInputElement).value,
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
      pause: el.pause,
      paused: el.paused,
      play: el.play,
      playbackRate: el.playbackRate,
      readyState: el.readyState,
      src: el.src,
      volume: el.volume,
    }
  } else if (el instanceof HTMLButtonElement) {
    return {
      ...base,
      innerText: el.innerText,
    }
  }
  return base
}

export class ClickSignalsGenerator implements SignalGenerator {
  id = 'click'
  register(emitter: SignalEmitter) {
    const handleClick = (ev: MouseEvent) => {
      const target = (ev.target as HTMLElement) ?? {}
      emitter.emit({
        type: 'interaction',
        data: {
          eventType: 'click',
          target: parseElement(target),
        },
      })
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick)
  }
}

export class FormSubmitGenerator implements SignalGenerator {
  id = 'form-submit'
  register(emitter: SignalEmitter) {
    const handleSubmit = (ev: SubmitEvent) => {
      const target = ev.submitter!
      emitter.emit({
        type: 'interaction',
        data: {
          eventType: 'submit',
          submitter: parseElement(target),
        },
      })
    }
    document.addEventListener('submit', handleSubmit, true)
    return () => document.removeEventListener('submit', handleSubmit)
  }
}

export class OnChangeGenerator implements SignalGenerator {
  id = 'change'
  register(emitter: SignalEmitter) {
    const handleChange = (event: Event) => {
      const target = event.target as HTMLElement
      emitter.emit({
        type: 'interaction',
        data: {
          eventType: 'change',
          target: parseElement(target),
        },
      })
    }
    document.addEventListener('change', handleChange, true)
    return () => document.removeEventListener('change', handleChange)
  }
}

export const domGenerators = [
  ClickSignalsGenerator,
  FormSubmitGenerator,
  OnChangeGenerator,
]
