import { test, expect } from '@playwright/test'

test('Homepage has welcome message', async ({ page }) => {
  await page.goto('https://www.example.com/')
  await expect(page.locator('text=Example Domain')).toBeVisible()
})
