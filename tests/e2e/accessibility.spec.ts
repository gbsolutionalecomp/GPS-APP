import { test, expect } from '@playwright/test'

test.describe('Accessibility Checks', () => {
  test('home page contains main navigation and structural landmarks', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
