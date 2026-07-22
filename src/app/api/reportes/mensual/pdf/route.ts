import { NextResponse } from 'next/server'
import { getAppSnapshot } from '@/data/server-snapshot'
import { authorizeAdmin } from '@/lib/authorization'
import { filterMonthlyJourneys, parseMonthlyReportFilters } from '@/features/reports/filters'
import { loadEvidenceImage } from '@/features/reports/images'
import { buildMonthlyPdf } from '@/features/reports/pdf'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authorization = await authorizeAdmin()
  if (!authorization.ok) return authorization.response
  try {
    const filters = parseMonthlyReportFilters(new URL(request.url))
    const snapshot = await getAppSnapshot()
    const bytes = await buildMonthlyPdf({ snapshot, journeys: filterMonthlyJourneys(snapshot, filters), month: filters.month, getImage: loadEvidenceImage })
    return new Response(bytes.buffer as ArrayBuffer, { headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="GBS-viajes-${filters.month}.pdf"`, 'cache-control': 'no-store' } })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'No fue posible crear el PDF.' }, { status: 400 })
  }
}
