import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import Workbook from 'exceljs'
import Papa from 'papaparse'

export interface ReportItem {
  id: string
  fecha: string
  vehiculo: string
  proyecto: string
  ingeniero: string
  distanciaGpsKm: number
  odometroInicialKm?: number
  odometroFinalKm?: number
  distanciaOdometroKm?: number
  diferenciaKm?: number
  estado: string
}

export async function generateCSVReport(items: ReportItem[]): Promise<string> {
  const data = items.map((item) => ({
    'ID Viaje': item.id,
    Fecha: item.fecha,
    Vehículo: item.vehiculo,
    Proyecto: item.proyecto,
    Ingeniero: item.ingeniero,
    'Distancia GPS (km)': item.distanciaGpsKm,
    'Odómetro Inicial (km)': item.odometroInicialKm ?? '-',
    'Odómetro Final (km)': item.odometroFinalKm ?? '-',
    'Distancia Odómetro (km)': item.distanciaOdometroKm ?? '-',
    'Diferencia (km)': item.diferenciaKm ?? '-',
    Estado: item.estado,
  }))
  return Papa.unparse(data)
}

export async function generateExcelReportBuffer(items: ReportItem[]): Promise<Buffer> {
  const workbook = new Workbook.Workbook()
  const worksheet = workbook.addWorksheet('Reporte de Viajes GPS')

  worksheet.columns = [
    { header: 'ID Viaje', key: 'id', width: 25 },
    { header: 'Fecha', key: 'fecha', width: 15 },
    { header: 'Vehículo', key: 'vehiculo', width: 15 },
    { header: 'Proyecto', key: 'proyecto', width: 20 },
    { header: 'Ingeniero', key: 'ingeniero', width: 20 },
    { header: 'Dist. GPS (km)', key: 'distanciaGpsKm', width: 15 },
    { header: 'Odo. Inicial (km)', key: 'odometroInicialKm', width: 18 },
    { header: 'Odo. Final (km)', key: 'odometroFinalKm', width: 18 },
    { header: 'Dist. Odómetro (km)', key: 'distanciaOdometroKm', width: 20 },
    { header: 'Diferencia (km)', key: 'diferenciaKm', width: 15 },
    { header: 'Estado', key: 'estado', width: 20 },
  ]

  items.forEach((item) => {
    worksheet.addRow({
      id: item.id,
      fecha: item.fecha,
      vehiculo: item.vehiculo,
      proyecto: item.proyecto,
      ingeniero: item.ingeniero,
      distanciaGpsKm: item.distanciaGpsKm,
      odometroInicialKm: item.odometroInicialKm ?? 0,
      odometroFinalKm: item.odometroFinalKm ?? 0,
      distanciaOdometroKm: item.distanciaOdometroKm ?? 0,
      diferenciaKm: item.diferenciaKm ?? 0,
      estado: item.estado,
    })
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

export async function generatePDFReportBuffer(items: ReportItem[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = 750
  page.drawText('GBS - Reporte Institucional de Viajes y GPS', { x: 50, y, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.5) })
  y -= 30

  page.drawText(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, { x: 50, y, size: 10, font })
  y -= 25

  page.drawText('ID / Vehículo / Proyecto / Dist. GPS / Estado', { x: 50, y, size: 10, font: boldFont })
  y -= 15

  items.slice(0, 30).forEach((item) => {
    const text = `${item.id.slice(0, 8)} | ${item.vehiculo} | ${item.proyecto} | ${item.distanciaGpsKm} km | ${item.estado}`
    page.drawText(text, { x: 50, y, size: 9, font })
    y -= 15
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
