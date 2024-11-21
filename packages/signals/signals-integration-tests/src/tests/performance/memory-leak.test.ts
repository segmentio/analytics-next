import { test } from '@playwright/test'
import { IndexPage } from './index-page'
import { sleep } from '@segment/analytics-core'

declare global {
  interface Performance {
    memory: {
      usedJSHeapSize: number
      totalJSHeapSize: number
    }
  }
}

const basicEdgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

let indexPage: IndexPage

test.beforeEach(async ({ page }) => {
  indexPage = await new IndexPage().loadAndWait(page, basicEdgeFn)
})

test.only('memory leak', async ({ page }) => {
  await indexPage.waitForSignalsApiFlush()
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

  await sleep(3000)

  // remove all the nodes
  await page.evaluate(() => {
    const target = document.getElementById('test-container')!
    while (target.firstChild) {
      target.removeChild(target.firstChild)
    }
  })

  // Analyze memory usage
  await sleep(3000)
  const lastMemory = await getMemoryUsage()

  // Allow some fluctuation, but fail if there's a significant memory increase
  if (lastMemory > firstMemory * ALLOWED_GROWTH) {
    throw new Error(
      `Memory leak detected! Initial: ${firstMemory}, Final: ${lastMemory}. Threshold`
    )
  } else {
    console.log(
      'Memory leak test passed!',
      `initial: ${firstMemory}, final: ${lastMemory}, allowed growth: ${ALLOWED_GROWTH}`
    )
  }
})
