import { expect, test } from '@playwright/test'

test('administrador consulta recorridos, programación y reportes', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /control de viajes/i })).toBeVisible()
  await page.goto('/viajes')
  await expect(page.getByRole('heading', { name: /viajes y paradas/i })).toBeVisible()
  await expect(page.getByText(/oficinas gbs monterrey/i).first()).toBeVisible()
  await page.goto('/programacion')
  await expect(page.getByRole('heading', { name: /programación/i })).toBeVisible()
  await page.goto('/reportes')
  await expect(page.getByRole('heading', { name: /reporte mensual/i })).toBeVisible()
})

test('ingeniero sólo navega sus viajes desde vista móvil', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('combobox', { name: /cambiar rol de demostración/i }).selectOption('engineer')
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('gbs-gps-demo-v1') ?? '{}').currentUser?.role === 'engineer')
  await expect(page.getByRole('heading', { name: /mis viajes/i })).toBeVisible()
  await expect(page.getByText(/RTP-482-A/).first()).toBeVisible()
})
