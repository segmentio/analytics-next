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
    gauge('load_time', loadTime(next), ['flavor:next']),
    gauge('start_to_interactive', startToInteractive(next), ['flavor:next']),
    gauge('dom_content_loaded', DOMContentLoaded(next), ['flavor:next']),
    gauge('load_time', loadTime(classic), ['flavor:next']),
    gauge('start_to_interactive', startToInteractive(classic), ['flavor:next']),
    gauge('dom_content_loaded', DOMContentLoaded(classic), ['flavor:next']),
  ])
}

export async function getMetrics(page: Page): Promise<PerformanceTiming> {
  const performanceTimingJson = await page.evaluate(() =>
    JSON.stringify(window.performance.timing)
  )
  return JSON.parse(performanceTimingJson) as PerformanceTiming
}
