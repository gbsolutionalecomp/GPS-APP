import { test, expect } from '@playwright/test'

test.describe('GPS Tracking & Telemetry Flow', () => {
  test('checks health endpoint response for telemetry readiness', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.ok).toBe(true)
  })
})
