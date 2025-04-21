import type { Reporter } from '@playwright/test/types/testReporter'
import type { TestCase } from '@playwright/test/types/testReporter'
import type { TestResult } from '@playwright/test/types/testReporter'

class PlaywrightLogger implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    const passed = result.status === 'passed'
    console.log(
      [
        `${passed ? '✅ Passed' : '❌ Failed'}! ${test.title}`,
        test.location.file,
        !passed && result.error ? result.error.message : '',
      ].join('\n')
    )
  }
}

export default PlaywrightLogger
