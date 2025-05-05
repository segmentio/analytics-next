import { test, expect, Page } from '@playwright/test'
import { IndexPage } from './index-page'
import { sleep } from '@segment/analytics-core'

declare global {
  interface Window {
    gc: () => void // chrome specific
  }
  interface Performance {
    memory: {
      usedJSHeapSize: number
      totalJSHeapSize: number
    }
  }
}

const basicEdgeFn = `
    // this is a process signal function
    function processSignal(signal) {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

const checkForMemoryLeak = async (page: Page) => {
  const ALLOWED_GROWTH = 1.1
  const getMemoryUsage = (): Promise<number> =>
    page.evaluate(() => {
      return performance.memory.usedJSHeapSize
    })

  const firstMemory = await getMemoryUsage()

  // add nodes
  await page.evaluate(() => {
    const target = document.getElementById('test-container')!
    const NODE_COUNT = 2000
    for (let i = 0; i < NODE_COUNT; i++) {
      const newNode = document.createElement('input')
      newNode.type = 'text'
      newNode.value = Math.random().toString()
      target.appendChild(newNode)
    }
  })

  // remove all the nodes
  await page.evaluate(() => {
    const target = document.getElementById('test-container')!
    while (target.firstChild) {
      target.removeChild(target.firstChild)
    }
  })
  const inputNodeLength = await page.evaluate(
    () => document.querySelectorAll('input').length
  )
  expect(inputNodeLength).toBe(0)

  await page.evaluate(() => {
    // force run garbage collection: --js-flags="--expose-gc" is required
    window.gc()
  })

  await sleep(500) // may not be needed, but just in case.

  const lastMemory = await getMemoryUsage() // Allow some fluctuation, but fail if there's a significant memory increase
  const report = `initial: ${firstMemory}, final: ${lastMemory}, allowed growth: ${ALLOWED_GROWTH}`
  if (lastMemory > firstMemory * ALLOWED_GROWTH) {
    throw new Error(`Memory leak detected! ${report}`)
  } else {
    console.log('Memory leak test passed!', `initial: ${report}`)
  }
}

test('memory leak test scaffold works', async ({ page }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <div id="test-container"></div>
      </body>
    </html>
  `
  await page.setContent(htmlContent)
  await page.waitForLoadState('networkidle')
  await checkForMemoryLeak(page)
})

test('memory leak', async ({ page }) => {
  const indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
  await indexPage.waitForSignalsApiFlush()
  await page.waitForLoadState('networkidle')
  await checkForMemoryLeak(page)
})
