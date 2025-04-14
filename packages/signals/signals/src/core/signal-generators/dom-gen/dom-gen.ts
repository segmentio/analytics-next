import { createInteractionSignal } from '../../../types/factories'
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
