import { test, expect } from '@playwright/test'

test('Example Test Case to check playwright is installed', async ({ page }) => {
  await page.goto('https://www.example.com/')
  await expect(page.locator('text=Example Domain')).toBeVisible()
})
