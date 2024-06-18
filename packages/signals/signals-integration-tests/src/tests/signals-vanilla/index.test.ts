import { test, expect } from '@playwright/test'
import * as path from 'path'
import { execSync } from 'child_process'

// Build the project with Webpack before running tests
execSync('yarn build', { stdio: 'inherit' })

test('greetUser function works correctly', async ({ page }) => {
  // Define the path to the HTML file
  const filePath = path.resolve(__dirname, 'index.html')
  await page.goto(`file://${filePath}`)

  // Perform actions and assertions
  const greeting = await page.evaluate(() => {
    return (window as any).analytics
  })

  expect(greeting).toBe('Hello, World!')
})
