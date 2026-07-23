import { type NextRequest, NextResponse } from 'next/server'
import { getAppSnapshot } from '@/data/server-snapshot'
import { generateCSVReport, generateExcelReportBuffer, generatePDFReportBuffer, type ReportItem } from '@/lib/exports'
import { apiError } from '@/lib/api-response'
import type { Journey, Vehicle, Project } from '@/domain/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')?.toLowerCase() || 'csv'

  const snapshot = await getAppSnapshot()
  const journeys = snapshot.journeys
  const vehicles = snapshot.vehicles
  const projects = snapshot.projects

  const items: ReportItem[] = journeys.map((j: Journey) => {
    const v = vehicles.find((v: Vehicle) => v.id === j.vehicleId)
    const p = projects.find((p: Project) => p.id === j.projectId)
    const evidenceList = snapshot.evidence.filter((e) => e.journeyId === j.id)
    const initialEvidence = evidenceList.find((e) => e.kind === 'before')
    const finalEvidence = evidenceList.find((e) => e.kind === 'after')
    return {
      id: j.id,
      fecha: j.actualStart || j.createdAt,
      vehiculo: v ? `${v.name} (${v.plate})` : j.vehicleId,
      proyecto: p ? p.name : j.projectId ?? 'Sin Asignar',
      ingeniero: j.engineerId ?? 'Sin Asignar',
      distanciaGpsKm: j.gpsDistanceKm ?? 0,
      odometroInicialKm: initialEvidence?.readingKm,
      odometroFinalKm: finalEvidence?.readingKm,
      distanciaOdometroKm: initialEvidence && finalEvidence ? finalEvidence.readingKm - initialEvidence.readingKm : undefined,
      diferenciaKm: undefined,
      estado: j.actualEnd ? 'finalizado' : 'en_curso',
    }
  })

  if (format === 'csv') {
    const csvData = await generateCSVReport(items)
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="reporte_viajes.csv"',
      },
    })
  }

  if (format === 'excel' || format === 'xlsx') {
    const buffer = await generateExcelReportBuffer(items)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename="reporte_viajes.xlsx"',
      },
    })
  }

  if (format === 'pdf') {
    const buffer = await generatePDFReportBuffer(items)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="reporte_viajes.pdf"',
      },
    })
  }

  return apiError('Formato no soportado. Usa pdf, excel, o csv.', 400)
}
