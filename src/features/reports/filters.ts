import type { AppSnapshot, Journey } from '@/domain/types'
import { getJourneyState, isJourneyInMonth } from '@/domain/journeys'

export interface MonthlyReportFilters {
  month: string
  projectId?: string
  vehicleId?: string
  engineerId?: string
  status?: string
}

const selected = (value?: string) => value && value !== 'all' ? value : undefined

export function parseMonthlyReportFilters(url: URL): MonthlyReportFilters {
  const fallback = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit',
  }).format(new Date()).slice(0, 7)
  const month = url.searchParams.get('month') ?? fallback
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('El mes del reporte no es válido.')
  return {
    month,
    projectId: selected(url.searchParams.get('projectId') ?? undefined),
    vehicleId: selected(url.searchParams.get('vehicleId') ?? undefined),
    engineerId: selected(url.searchParams.get('engineerId') ?? undefined),
    status: selected(url.searchParams.get('status') ?? undefined),
  }
}

export function filterMonthlyJourneys(snapshot: AppSnapshot, filters: MonthlyReportFilters): Journey[] {
  return snapshot.journeys
    .filter((journey) => isJourneyInMonth(journey, filters.month))
    .filter((journey) => !filters.projectId || journey.projectId === filters.projectId)
    .filter((journey) => !filters.vehicleId || journey.vehicleId === filters.vehicleId)
    .filter((journey) => !filters.engineerId || journey.engineerId === filters.engineerId)
    .filter((journey) => !filters.status || getJourneyState(journey, snapshot.evidence).workflow === filters.status)
    .sort((a, b) => Date.parse(b.actualStart ?? b.plannedStart ?? b.createdAt) - Date.parse(a.actualStart ?? a.plannedStart ?? a.createdAt))
}
