import { test, expect } from '@playwright/test'

test.describe('Responsive Layout', () => {
  test('renders properly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('renders properly on mobile viewport (Pixel 7)', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })
})
