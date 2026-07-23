import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('navigates to login page and displays form elements', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/GBS/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('handles login form submission', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@gbsolution.com')
    await page.fill('input[type="password"]', 'demo123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/**')
  })
})
