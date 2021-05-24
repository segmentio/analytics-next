import { Page } from 'playwright'
import { Context } from '../../src/core/context'
import { gauge } from './stats'

const loadTime = (timing: PerformanceTiming) =>
  timing.loadEventEnd - timing.loadEventStart

const DOMContentLoaded = (timing: PerformanceTiming) =>
  timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart

const startToInteractive = (timing: PerformanceTiming) =>
  timing.domInteractive - timing.navigationStart

export function reportMetrics(
  next: PerformanceTiming,
  classic: PerformanceTiming
): Promise<Context[]> {
  return Promise.all([
    gauge('load_time', loadTime(next), ['release:next']),
    gauge('start_to_interactive', startToInteractive(next), ['release:next']),
    gauge('dom_content_loaded', DOMContentLoaded(next), ['release:next']),

    gauge('load_time', loadTime(classic), ['release:classic']),
    gauge('start_to_interactive', startToInteractive(classic), [
      'release:classic',
    ]),
    gauge('dom_content_loaded', DOMContentLoaded(classic), ['release:classic']),
  ])
}

export async function getMetrics(page: Page): Promise<PerformanceTiming> {
  const performanceTimingJson = await page.evaluate(() =>
    JSON.stringify(window.performance.timing)
  )
  return JSON.parse(performanceTimingJson) as PerformanceTiming
}
