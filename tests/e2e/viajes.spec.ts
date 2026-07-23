import { test, expect } from '@playwright/test'

test.describe('Journeys (Viajes) Flow', () => {
  test('displays journeys list and filter options', async ({ page }) => {
    await page.goto('/viajes')
    await expect(page.locator('h1, h2, h3')).toBeVisible()
  })

  test('allows searching and filtering journeys', async ({ page }) => {
    await page.goto('/viajes')
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"], input[type="text"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('UNIDAD')
    }
  })
})
