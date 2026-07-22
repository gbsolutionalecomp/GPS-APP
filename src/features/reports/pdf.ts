import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage } from 'pdf-lib'
import type { AppSnapshot, Journey, OdometerEvidence } from '@/domain/types'
import { calculateOdometerDelta, evidenceForJourney, getJourneyState } from '@/domain/journeys'
import { formatDateTime, formatKm } from '@/domain/format'
import type { ReportImage } from './images'

interface PdfOptions {
  snapshot: AppSnapshot
  journeys: Journey[]
  month: string
  getImage?: (evidence?: OdometerEvidence) => Promise<ReportImage | null>
}

function drawField(page: PDFPage, label: string, value: string, x: number, y: number, width: number, regular: Awaited<ReturnType<PDFDocument['embedFont']>>, bold: Awaited<ReturnType<PDFDocument['embedFont']>>) {
  page.drawText(label.toUpperCase(), { x, y, size: 7.5, font: bold, color: rgb(0.38, 0.47, 0.55) })
  const text = value.length > 44 ? `${value.slice(0, 41)}...` : value
  page.drawText(text, { x, y: y - 15, size: 10, font: regular, color: rgb(0.09, 0.2, 0.3), maxWidth: width })
}

async function embed(document: PDFDocument, image: ReportImage | null): Promise<PDFImage | null> {
  if (!image) return null
  try { return image.extension === 'png' ? await document.embedPng(image.bytes) : await document.embedJpg(image.bytes) } catch { return null }
}

export async function buildMonthlyPdf({ snapshot, journeys, month, getImage }: PdfOptions): Promise<Uint8Array> {
  const document = await PDFDocument.create()
  document.setTitle(`GBS · Reporte de viajes ${month}`)
  document.setAuthor('GBSolution')
  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const pages = journeys.length ? journeys : [null]
  for (const [index, journey] of pages.entries()) {
    const page = document.addPage([792, 612])
    page.drawRectangle({ x: 0, y: 548, width: 792, height: 64, color: rgb(0.055, 0.16, 0.25) })
    page.drawText('GBSOLUTION', { x: 38, y: 579, size: 9, font: bold, color: rgb(0.35, 0.86, 0.78) })
    page.drawText('Control mensual de viajes y GPS', { x: 38, y: 560, size: 18, font: bold, color: rgb(1, 1, 1) })
    page.drawText(`${month}  ·  ${journeys.length} recorridos  ·  ${index + 1}/${pages.length}`, { x: 552, y: 574, size: 9, font: regular, color: rgb(0.84, 0.9, 0.94) })
    if (!journey) {
      page.drawText('No hay recorridos para los filtros seleccionados.', { x: 185, y: 300, size: 16, font: bold, color: rgb(0.25, 0.34, 0.42) })
      continue
    }
    const pair = evidenceForJourney(snapshot.evidence, journey.id)
    const state = getJourneyState(journey, snapshot.evidence)
    const odometerKm = calculateOdometerDelta(pair.before, pair.after)
    const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
    const project = snapshot.projects.find((item) => item.id === journey.projectId)
    const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
    page.drawText(journey.externalId ?? `Recorrido ${journey.id.slice(0, 8)}`, { x: 38, y: 518, size: 16, font: bold, color: rgb(0.06, 0.45, 0.41) })
    const statusColor = state.workflow === 'complete' ? rgb(0.03, 0.48, 0.3) : rgb(0.73, 0.14, 0.09)
    page.drawText(state.label, { x: 610, y: 520, size: 10, font: bold, color: statusColor })
    drawField(page, 'Fecha', formatDateTime(journey.actualStart ?? journey.plannedStart), 38, 485, 165, regular, bold)
    drawField(page, 'Vehículo', vehicle ? `${vehicle.plate} · ${vehicle.name}` : 'Pendiente', 220, 485, 180, regular, bold)
    drawField(page, 'Proyecto', project ? `${project.code} · ${project.name}` : 'Sin asignar', 420, 485, 165, regular, bold)
    drawField(page, 'Ingeniero', engineer?.fullName ?? 'Sin asignar', 610, 485, 145, regular, bold)
    drawField(page, 'Origen', journey.origin ?? 'Pendiente', 38, 442, 335, regular, bold)
    drawField(page, 'Destino', journey.destination ?? 'Pendiente', 407, 442, 347, regular, bold)
    page.drawRectangle({ x: 38, y: 370, width: 716, height: 50, color: rgb(0.94, 0.97, 0.98), borderColor: rgb(0.83, 0.88, 0.91), borderWidth: 1 })
    const metrics = [
      ['GPS', formatKm(journey.gpsDistanceKm)], ['Odómetro', formatKm(odometerKm)],
      ['Diferencia', odometerKm === null || journey.gpsDistanceKm === undefined ? 'Pendiente' : formatKm(Math.round((odometerKm - journey.gpsDistanceKm) * 10) / 10)],
    ]
    metrics.forEach(([label, value], metricIndex) => {
      const x = 68 + metricIndex * 235
      page.drawText(label!, { x, y: 400, size: 8, font: bold, color: rgb(0.36, 0.45, 0.52) })
      page.drawText(value!, { x, y: 382, size: 14, font: bold, color: rgb(0.08, 0.21, 0.31) })
    })
    const images = await Promise.all([getImage?.(pair.before) ?? null, getImage?.(pair.after) ?? null])
    const embedded = await Promise.all(images.map((image) => embed(document, image)))
    const evidenceValues = [pair.before, pair.after]
    ;(['ODÓMETRO INICIAL', 'ODÓMETRO FINAL'] as const).forEach((label, imageIndex) => {
      const x = imageIndex === 0 ? 38 : 407
      page.drawText(label, { x, y: 342, size: 9, font: bold, color: rgb(0.06, 0.45, 0.41) })
      page.drawRectangle({ x, y: 98, width: 347, height: 228, color: rgb(0.96, 0.97, 0.98), borderColor: rgb(0.82, 0.86, 0.89), borderWidth: 1 })
      const image = embedded[imageIndex]
      if (image) {
        const scale = Math.min(329 / image.width, 190 / image.height)
        const width = image.width * scale; const height = image.height * scale
        page.drawImage(image, { x: x + (347 - width) / 2, y: 125 + (190 - height) / 2, width, height })
      } else {
        page.drawText(evidenceValues[imageIndex] ? 'Fotografía registrada' : 'FOTOGRAFÍA FALTANTE', { x: x + 92, y: 213, size: 11, font: bold, color: evidenceValues[imageIndex] ? rgb(0.31, 0.4, 0.47) : rgb(0.73, 0.14, 0.09) })
      }
      page.drawText(evidenceValues[imageIndex] ? `${evidenceValues[imageIndex]!.readingKm.toLocaleString('es-MX')} km` : 'Lectura pendiente', { x: x + 12, y: 108, size: 10, font: bold, color: rgb(0.08, 0.21, 0.31) })
    })
    page.drawText('Fechas agrupadas en America/Mexico_City · Las fotografías permanecen en almacenamiento privado.', { x: 38, y: 58, size: 8, font: regular, color: rgb(0.4, 0.47, 0.52) })
  }
  return document.save()
}
