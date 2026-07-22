import ExcelJS from 'exceljs'
import type { AppSnapshot, Journey, OdometerEvidence } from '@/domain/types'
import { calculateOdometerDelta, deriveSegments, evidenceForJourney, getJourneyState } from '@/domain/journeys'
import { formatDateTime } from '@/domain/format'
import type { ReportImage } from './images'

interface WorkbookOptions {
  snapshot: AppSnapshot
  journeys: Journey[]
  month: string
  getImage?: (evidence?: OdometerEvidence) => Promise<ReportImage | null>
}

const navy = '17324D'
const teal = '0F766E'
const light = 'E8F0F5'

function styleSheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(widths.length).letter}1` }
  sheet.getRow(1).height = 26
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${navy}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width })
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle', wrapText: true }
      if (rowNumber % 2 === 0) row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${light}` } } })
    }
  })
}

export async function buildMonthlyWorkbook({ snapshot, journeys, month, getImage }: WorkbookOptions): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GBSolution · Control de Viajes y GPS'
  workbook.created = new Date()
  workbook.subject = `Reporte mensual ${month}`
  const journeySheet = workbook.addWorksheet('Recorridos', { properties: { defaultRowHeight: 22 } })
  journeySheet.addRow(['Fecha', 'Recorrido', 'Estado', 'Vehículo', 'Proyecto', 'Ingeniero', 'Origen', 'Destino', 'GPS km', 'Odómetro inicial', 'Odómetro final', 'Odómetro km', 'Diferencia km', 'Foto inicial', 'Foto final'])

  for (const journey of journeys) {
    const pair = evidenceForJourney(snapshot.evidence, journey.id)
    const odometerKm = calculateOdometerDelta(pair.before, pair.after)
    const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
    const project = snapshot.projects.find((item) => item.id === journey.projectId)
    const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
    const state = getJourneyState(journey, snapshot.evidence)
    const row = journeySheet.addRow([
      formatDateTime(journey.actualStart ?? journey.plannedStart ?? journey.createdAt), journey.externalId ?? journey.id,
      state.label, vehicle ? `${vehicle.plate} · ${vehicle.name}` : 'Vehículo pendiente', project ? `${project.code} · ${project.name}` : 'Sin asignar',
      engineer?.fullName ?? 'Sin asignar', journey.origin ?? 'Pendiente', journey.destination ?? 'Pendiente', journey.gpsDistanceKm ?? null,
      pair.before?.readingKm ?? null, pair.after?.readingKm ?? null, odometerKm, odometerKm === null || journey.gpsDistanceKm === undefined ? null : Math.round((odometerKm - journey.gpsDistanceKm) * 10) / 10,
      pair.before ? 'Adjunta' : 'Faltante', pair.after ? 'Adjunta' : 'Faltante',
    ])
    if (state.workflow !== 'complete') row.getCell(3).font = { bold: true, color: { argb: 'FFB42318' } }
    row.height = 66
    if (getImage) {
      for (const [column, evidence] of [[14, pair.before], [15, pair.after]] as const) {
        const image = await getImage(evidence)
        if (!image) continue
        const imageId = workbook.addImage({ base64: Buffer.from(image.bytes).toString('base64'), extension: image.extension })
        journeySheet.addImage(imageId, { tl: { col: column - 1 + 0.08, row: row.number - 1 + 0.08 }, ext: { width: 92, height: 78 }, editAs: 'oneCell' })
        row.getCell(column).value = ''
      }
    }
  }
  styleSheet(journeySheet, [20, 22, 23, 29, 30, 24, 30, 30, 12, 16, 16, 14, 14, 16, 16])
  journeySheet.getColumn(9).numFmt = '0.0'
  journeySheet.getColumn(12).numFmt = '0.0'
  journeySheet.getColumn(13).numFmt = '0.0;[Red]-0.0'

  const segmentSheet = workbook.addWorksheet('Tramos', { properties: { defaultRowHeight: 22 } })
  segmentSheet.addRow(['Recorrido', 'Tramo', 'Vehículo', 'Proyecto', 'Ingeniero', 'Origen', 'Destino', 'Salida', 'Llegada'])
  for (const journey of journeys) {
    const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
    const project = snapshot.projects.find((item) => item.id === journey.projectId)
    const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
    for (const segment of deriveSegments(journey, snapshot.stops)) {
      segmentSheet.addRow([journey.externalId ?? journey.id, segment.sequence, vehicle?.plate ?? 'Pendiente', project?.code ?? 'Sin asignar', engineer?.fullName ?? 'Sin asignar', segment.origin, segment.destination, formatDateTime(segment.startedAt), formatDateTime(segment.endedAt)])
    }
  }
  styleSheet(segmentSheet, [22, 10, 18, 18, 24, 35, 35, 21, 21])
  journeySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${teal}` } }
  return new Uint8Array(await workbook.xlsx.writeBuffer() as ArrayBuffer)
}
