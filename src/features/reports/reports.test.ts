import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { demoSnapshot } from '@/data/demo'
import { filterMonthlyJourneys } from './filters'
import { buildMonthlyPdf } from './pdf'
import { buildMonthlyWorkbook } from './xlsx'

describe('exportaciones mensuales', () => {
  const journeys = filterMonthlyJourneys(demoSnapshot, { month: '2026-07' })

  it('produce Excel con Recorridos y Tramos', async () => {
    const bytes = await buildMonthlyWorkbook({ snapshot: demoSnapshot, journeys, month: '2026-07' })
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(bytes as never)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Recorridos', 'Tramos'])
    expect(workbook.getWorksheet('Recorridos')!.rowCount).toBeGreaterThan(1)
  })

  it('produce un PDF por recorrido, incluyendo pendientes', async () => {
    const bytes = await buildMonthlyPdf({ snapshot: demoSnapshot, journeys, month: '2026-07' })
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('%PDF')
  })
})
