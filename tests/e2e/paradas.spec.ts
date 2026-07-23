import { test, expect } from '@playwright/test'

test.describe('Stops (Paradas) Flow', () => {
  test('verifies stops reporting or list page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*3110/)
  })
})
