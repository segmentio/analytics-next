import { Page } from 'playwright'
import { statsd } from './stats'

const loadTime = (timing: PerformanceTiming) =>
  timing.loadEventEnd - timing.loadEventStart

const DOMContentLoaded = (timing: PerformanceTiming) =>
  timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart

const startToInteractive = (timing: PerformanceTiming) =>
  timing.domInteractive - timing.navigationStart

export function reportMetrics(
  next: PerformanceTiming,
  classic: PerformanceTiming
): void {
  statsd.gauge('load_time', loadTime(next), ['flavor:next'])
  statsd.gauge('start_to_interactive', startToInteractive(next), [
    'flavor:next',
  ])
  statsd.gauge('dom_content_loaded', DOMContentLoaded(next), ['flavor:next'])

  statsd.gauge('load_time', loadTime(classic), ['flavor:next'])
  statsd.gauge('start_to_interactive', startToInteractive(classic), [
    'flavor:next',
  ])
  statsd.gauge('dom_content_loaded', DOMContentLoaded(classic), ['flavor:next'])
}

export async function getMetrics(page: Page): Promise<PerformanceTiming> {
  const performanceTimingJson = await page.evaluate(() =>
    JSON.stringify(window.performance.timing)
  )
  return JSON.parse(performanceTimingJson) as PerformanceTiming
}
