import { sleep } from '@segment/analytics-core'

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 1000
): Promise<void> => {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout of ${timeout}ms exceeded!`)
    }
    await sleep(10)
  }
}
