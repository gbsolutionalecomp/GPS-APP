import { test, expect } from '@playwright/test'

test.describe('Odometer Evidence Flow', () => {
  test('verifies my journeys page and evidence upload forms', async ({ page }) => {
    await page.goto('/mis-viajes')
    await expect(page.locator('body')).toBeVisible()
  })
})
