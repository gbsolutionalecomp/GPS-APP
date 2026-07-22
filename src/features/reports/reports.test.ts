import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import type { AppSnapshot } from '@/domain/types'
import { filterMonthlyJourneys } from './filters'
import { buildMonthlyPdf } from './pdf'
import { buildMonthlyWorkbook } from './xlsx'

const testSnapshot: AppSnapshot = {
  currentUser: { id: 'p1', fullName: 'Laura', email: 'admin@gbs.local', role: 'admin', active: true },
  profiles: [{ id: 'p1', fullName: 'Laura', email: 'admin@gbs.local', role: 'admin', active: true }],
  projects: [{ id: 'proj-1', code: 'PRY-001', name: 'Proyecto Test', active: true }],
  vehicles: [{ id: 'v1', plate: 'RTP-482-A', name: 'Nissan NP300', active: true }],
  journeys: [{
    id: 'j1', source: 'planned', vehicleId: 'v1', projectId: 'proj-1', engineerId: 'p1',
    actualStart: '2026-07-18T14:06:00.000Z', actualEnd: '2026-07-18T20:31:00.000Z',
    origin: 'Oficinas GBS', destination: 'Planta', gpsDistanceKm: 50, createdAt: '2026-07-18T14:00:00.000Z', updatedAt: '2026-07-18T14:00:00.000Z',
  }],
  stops: [],
  evidence: [],
  syncRuns: [],
  integration: { mode: 'disabled', pollIntervalMinutes: 1 },
}

describe('exportaciones mensuales', () => {
  const journeys = filterMonthlyJourneys(testSnapshot, { month: '2026-07' })

  it('produce Excel con Recorridos y Tramos', async () => {
    const bytes = await buildMonthlyWorkbook({ snapshot: testSnapshot, journeys, month: '2026-07' })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(bytes as never)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Recorridos', 'Tramos'])
    expect(workbook.getWorksheet('Recorridos')!.rowCount).toBeGreaterThan(1)
  })

  it('produce un PDF por recorrido, incluyendo pendientes', async () => {
    const bytes = await buildMonthlyPdf({ snapshot: testSnapshot, journeys, month: '2026-07' })
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('%PDF')
  })
})

