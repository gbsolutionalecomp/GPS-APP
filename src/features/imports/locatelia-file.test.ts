import ExcelJS from 'exceljs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLocateliaFile } from './locatelia-file'

function loadFixtureFile(name: string): File {
  const path = join(process.cwd(), 'src/features/imports/fixtures', name)
  const buffer = readFileSync(path)
  return {
    name,
    size: buffer.byteLength,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    },
  } as unknown as File
}

async function makeHistoricalFile(): Promise<File> {
  const workbook = new ExcelJS.Workbook()
  const info = workbook.addWorksheet('Info')
  info.addRow([])
  info.addRow([])
  info.addRow([])
  info.addRow([])
  info.addRow(['Origen:', 'Históricos GPS'])
  info.addRow(['Fecha:', '21/07/2026'])
  info.addRow(['Empresa:', 'secovi sapi de cv'])
  info.addRow([])
  info.addRow(['Vehículo:', 'RK17022'])
  info.addRow(['Periodo:', '01/07/2026 06:00 - 21/07/2026 15:30'])
  info.addRow([])
  info.addRow(['Nota: Los datos están en la siguiente hoja'])

  const history = workbook.addWorksheet('Históricos GPS')
  history.addRow(['Fecha', 'Hora', 'Estado', 'Población', 'Zona', 'Provincia', 'Alarma', 'Anotaciones'])
  history.addRow(['30/06/2026', '22:57:13', 'Inicio Parada', '', '** MANUEL CASA', '', 'OFF', ''])
  history.addRow(['01/07/2026', '07:22:44', 'Fin Parada', '', '** MANUEL CASA', '', 'OFF', ''])
  history.addRow(['01/07/2026', '08:04:46', 'Inicio Parada', '', '** Corporativo Grupo Secovi', '', 'OFF', ''])
  history.addRow(['01/07/2026', '09:54:32', 'Fin Parada', '', '** Corporativo Grupo Secovi', '', 'OFF', ''])
  history.addRow(['01/07/2026', '10:01:39', 'Inicio Parada', 'Nuevo León', 'Privada Cerritos. Monterrey', '--MÉXICO--', 'OFF', ''])
  history.addRow(['01/07/2026', '10:06:42', 'Fin Parada', 'Nuevo León', 'Privada Cerritos. Monterrey', '--MÉXICO--', 'OFF', ''])

  const buffer = await workbook.xlsx.writeBuffer()
  return {
    name: 'secovi sapi de cv - RK17022 - Históricos GPS.xlsx',
    size: buffer.byteLength,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    async arrayBuffer() {
      return buffer
    },
  } as File
}

describe('parseLocateliaFile', () => {
  it('convierte un histórico GPS de Locatelia en registros de recorridos', async () => {
    const file = await makeHistoricalFile()
    const rows = await parseLocateliaFile(file)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      plate: 'RK17022',
      origin: '** MANUEL CASA',
      destination: '** Corporativo Grupo Secovi',
    })
    expect(String(rows[0]?.actualStart ?? '')).toContain('2026-07-01T')
    expect(String(rows[0]?.actualEnd ?? '')).toContain('2026-07-01T')
  })

  it('procesa un archivo real exportado por la plataforma sin errores (regresión de formato)', async () => {
    const file = loadFixtureFile('secovi-rk17022-historicos-gps.xlsx')
    const rows = await parseLocateliaFile(file)
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((row) => {
      expect(row.plate).toBe('RK17022')
      expect(String(row.actualStart)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(String(row.actualEnd)).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(new Date(String(row.actualEnd)).getTime()).toBeGreaterThanOrEqual(new Date(String(row.actualStart)).getTime())
    })
  })
})
