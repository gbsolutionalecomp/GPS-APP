import ExcelJS from 'exceljs'
import Papa from 'papaparse'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_ROWS = 2_000

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object') {
    if ('result' in value) return value.result
    if ('text' in value) return value.text
    if ('richText' in value) return value.richText.map((part) => part.text).join('')
  }
  return value ?? ''
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function parseHistoryDate(dateText: string, timeText: string): string | undefined {
  const date = String(dateText ?? '').trim()
  const time = String(timeText ?? '').trim()
  if (!date || !time) return undefined
  const match = date.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (!match) return undefined
  const local = `${match[3]}-${match[2]?.padStart(2, '0')}-${match[1]?.padStart(2, '0')}T${time.padStart(8, '0')}-06:00`
  const parsed = new Date(local)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

function isHistorySheet(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader)
  return normalized.includes('fecha') && normalized.includes('hora') && normalized.includes('estado')
}

function extractVehicleFromFilename(fileName: string): string | undefined {
  const match = fileName.match(/\b([A-Z0-9]{5,10})\b/i)
  return match?.[1] ? match[1].toUpperCase() : undefined
}

function findHeaderRow(sheet: ExcelJS.Worksheet): { rowNumber: number; headers: string[] } | null {
  for (let r = 1; r <= Math.min(sheet.rowCount, 10); r += 1) {
    const values = (sheet.getRow(r).values as ExcelJS.CellValue[]).slice(1).map((val) => String(cellValue(val)).trim())
    const normalized = values.map(normalizeHeader)
    if (
      (normalized.includes('fecha') && normalized.includes('hora') && normalized.includes('estado')) ||
      normalized.includes('placa') || normalized.includes('vehiculo') || normalized.includes('inicio')
    ) {
      return { rowNumber: r, headers: values }
    }
  }
  return null
}

function extractVehicleFromInfoSheet(workbook: ExcelJS.Workbook): string | undefined {
  const sheet = workbook.getWorksheet('Info') ?? workbook.worksheets.find((w) => normalizeHeader(w.name).includes('info'))
  if (!sheet) return undefined
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 20); rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    for (let col = 1; col <= 5; col += 1) {
      const left = String(cellValue(row.getCell(col).value)).trim()
      const right = String(cellValue(row.getCell(col + 1).value)).trim()
      if (normalizeHeader(left).includes('vehiculo') && right) return right
    }
  }
  return undefined
}

function parseHistoryWorkbook(sheet: ExcelJS.Worksheet, headerInfo: { rowNumber: number; headers: string[] }, inferredVehicle?: string): Record<string, unknown>[] {
  const { rowNumber: headerRowIndex, headers } = headerInfo
  const rows: Record<string, unknown>[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex || rows.length >= MAX_ROWS) return
    const record: Record<string, unknown> = {}
    headers.forEach((header, index) => { if (!header) return; record[header] = cellValue(row.getCell(index + 1).value) })
    const date = String(record[headers[0] ?? ''] ?? '').trim()
    const time = String(record[headers[1] ?? ''] ?? '').trim()
    const state = String(record[headers[2] ?? ''] ?? '').trim()
    const zone = String(record[headers[4] ?? ''] ?? '').trim()
    const population = String(record[headers[3] ?? ''] ?? '').trim()
    const location = zone ? (population ? `${zone} · ${population}` : zone) : (population || 'Ubicación sin nombre')
    if (!date || !time || !state) return
    rows.push({
      date,
      time,
      state,
      location,
      province: String(record[headers[5] ?? ''] ?? '').trim(),
      alarm: String(record[headers[6] ?? ''] ?? '').trim(),
      annotations: String(record[headers[7] ?? ''] ?? '').trim(),
      vehicle: inferredVehicle,
    })
  })
  return rows
}

function collapseHistoryRows(rows: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  const journeys: Record<string, unknown>[] = []
  let departureStop: { startAt: string; origin: string } | null = null
  let sequence = 1
  rows.forEach((row) => {
    const state = String(row.state ?? '').trim().toLowerCase()
    const location = String(row.location ?? '').trim()
    const timestamp = parseHistoryDate(String(row.date ?? ''), String(row.time ?? ''))
    if (!timestamp) return

    // "Fin Parada" = El carro termina la parada y comenzo a andar (Lugar de Origen y Hora de Salida)
    if (state === 'fin parada') {
      departureStop = { startAt: timestamp, origin: location || 'Origen sin nombre' }
      return
    }

    // "Inicio Parada" = El carro se pauso y llego a la parada (Lugar de Destino y Hora de Llegada)
    if (state === 'inicio parada' && departureStop) {
      const vehicle = String(row.vehicle ?? '').trim()
      const destination = location || departureStop.origin
      const externalId = `${vehicle || 'locatelia'}-${departureStop.startAt}-${timestamp}`
      journeys.push({
        externalId,
        plate: vehicle || undefined,
        actualStart: departureStop.startAt,
        actualEnd: timestamp,
        origin: departureStop.origin,
        destination,
        distance: '',
        stops: `${departureStop.origin}|${departureStop.startAt}|${timestamp};${destination}|${timestamp}|${timestamp}`,
        sequence,
      })
      sequence += 1
      departureStop = null
    }
  })
  return journeys
}

export async function parseLocateliaFile(file: File): Promise<Record<string, unknown>[]> {
  if (file.size > MAX_BYTES) throw new Error('El archivo supera el límite de 10 MB.')
  const bytes = Buffer.from(await file.arrayBuffer())
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'xlsx') {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('El archivo no es un XLSX válido.')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer)

    let inferredVehicle = extractVehicleFromInfoSheet(workbook) || extractVehicleFromFilename(file.name)

    for (const sheet of workbook.worksheets) {
      const headerInfo = findHeaderRow(sheet)
      if (headerInfo && isHistorySheet(headerInfo.headers)) {
        const historyRows = parseHistoryWorkbook(sheet, headerInfo, inferredVehicle)
        const collapsed = collapseHistoryRows(historyRows)
        if (collapsed.length) return collapsed
      }
    }

    // Fallback: standard table sheet
    const sheet = workbook.worksheets[0]
    if (!sheet || sheet.rowCount < 2) throw new Error('El Excel no contiene encabezados y datos.')
    const headerInfo = findHeaderRow(sheet) ?? { rowNumber: 1, headers: (sheet.getRow(1).values as ExcelJS.CellValue[]).slice(1).map((v) => String(cellValue(v)).trim()) }
    const { rowNumber: startRow, headers } = headerInfo
    const rows: Record<string, unknown>[] = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= startRow || rows.length >= MAX_ROWS) return
      const record: Record<string, unknown> = {}; let populated = false
      headers.forEach((header, index) => { if (!header) return; const value = cellValue(row.getCell(index + 1).value); record[header] = value; if (String(value).trim()) populated = true })
      if (populated) {
        if (!record.vehicle && inferredVehicle) record.vehicle = inferredVehicle
        rows.push(record)
      }
    })
    if (rows.length === 0) throw new Error('No se encontraron registros de recorridos válidos en el archivo.')
    return rows
  }
  if (!['csv', 'txt'].includes(extension ?? '')) throw new Error('Formato no permitido. Usa XLSX, CSV o TXT.')
  const source = bytes.toString('utf8').replace(/^\uFEFF/, '')
  if (source.includes('\u0000')) throw new Error('El archivo de texto contiene bytes no válidos.')
  const result = Papa.parse<Record<string, unknown>>(source, { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim() })
  if (result.errors.length) throw new Error(`Archivo inválido: ${result.errors[0]?.message ?? 'error de formato'}.`)
  if (result.data.length > MAX_ROWS) throw new Error(`El archivo supera ${MAX_ROWS.toLocaleString('es-MX')} filas.`)
  return result.data
}
