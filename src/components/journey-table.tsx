'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { deriveSegments, getJourneyState } from '@/domain/journeys'
import { formatDateTime, formatDuration } from '@/domain/format'
import type { AppSnapshot, Journey } from '@/domain/types'

export function JourneyTable({ journeys, snapshot, view = 'journeys' }: { journeys: readonly Journey[]; snapshot: AppSnapshot; view?: 'journeys' | 'segments' }) {
  if (!journeys.length) return <div className="empty-state"><Icon name="trip" size={28}/><strong>No hay viajes para estos filtros</strong><p>Prueba otro periodo o revisa la bandeja de importación.</p></div>
  if (view === 'segments') {
    const segments = journeys.flatMap((journey) => deriveSegments(journey, snapshot.stops).map((segment) => ({ journey, segment })))
    return <div className="table-wrap"><table className="data-table"><thead><tr><th>Viaje / tramo</th><th>Origen</th><th>Destino</th><th>Salida</th><th>Llegada</th><th>Duración</th><th>Unidad</th><th>Estado</th><th/></tr></thead><tbody>{segments.map(({ journey, segment }) => {
      const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
      const state = getJourneyState(journey, snapshot.evidence)
      return <tr key={segment.id}><td><strong>{journey.externalId ?? journey.id.slice(0, 8)}</strong><small>Tramo {segment.sequence}</small></td><td>{segment.origin}</td><td>{segment.destination}</td><td className="mono">{formatDateTime(segment.startedAt)}</td><td className="mono">{formatDateTime(segment.endedAt)}</td><td className="mono"><strong>{formatDuration(segment.startedAt, segment.endedAt)}</strong></td><td><strong>{vehicle?.plate ?? 'Sin unidad'}</strong><small>{vehicle?.name}</small></td><td><Badge tone={state.tone}>{state.label}</Badge></td><td><Link className="table-link" href={`/viajes/${journey.id}`}>Abrir <Icon name="arrow" size={14}/></Link></td></tr>
    })}</tbody></table></div>
  }
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Unidad</th><th>Origen</th><th>Destino</th><th>Horario de salida</th><th>Horario de destino</th><th>Tiempo transcurrido</th><th>Estado</th><th/></tr></thead><tbody>{journeys.map((journey) => {
    const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
    const state = getJourneyState(journey, snapshot.evidence)
    const start = journey.actualStart ?? journey.plannedStart
    const end = journey.actualEnd ?? journey.plannedEnd
    return <tr key={journey.id}><td><strong>{vehicle?.plate ?? 'Sin unidad'}</strong><small>{vehicle?.name ?? 'Unidad'}</small></td><td><strong>{journey.origin ?? 'Origen no especificado'}</strong></td><td><strong>{journey.destination ?? 'Destino no especificado'}</strong></td><td className="mono">{formatDateTime(start)}</td><td className="mono">{formatDateTime(end)}</td><td className="mono"><strong>{formatDuration(start, end)}</strong></td><td><Badge tone={state.tone}>{state.label}</Badge></td><td><Link className="table-link" href={`/viajes/${journey.id}`}>Detalle <Icon name="arrow" size={14}/></Link></td></tr>
  })}</tbody></table></div>
}
