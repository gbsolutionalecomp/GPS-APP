import { test, expect } from '@playwright/test'

test.describe('Performance Metrics', () => {
  test('home page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)
  })
})
