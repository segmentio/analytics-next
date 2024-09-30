import { Page } from '@playwright/test'
import type { Compute } from './ts'

export function waitForCondition(
  conditionFn: () => boolean,
  {
    checkInterval = 100,
    timeout = 10000,
    errorMessage = 'Condition was not met within the specified time.',
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const interval = setInterval(() => {
      try {
        if (conditionFn()) {
          clearInterval(interval)
          resolve()
        } else if (Date.now() - startTime >= timeout) {
          clearInterval(interval)
          reject(new Error(errorMessage))
        }
      } catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, checkInterval)
  })
}

type FillOptions = Compute<Parameters<Page['fill']>[2]>

export async function fillAndBlur(
  page: Page,
  selector: string,
  text: string,
  options: FillOptions = {}
) {
  await page.fill(selector, text, options)
  // Remove focus so the onChange event is triggered
  await page.evaluate(
    (args) => {
      const input = document.querySelector(args.selector) as HTMLElement
      if (input) {
        input.blur()
      }
    },
    { selector }
  )
}
