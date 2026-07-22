'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { deriveSegments, evidenceForJourney, getJourneyState } from '@/domain/journeys'
import { formatDateTime, formatKm } from '@/domain/format'
import type { AppSnapshot, Journey } from '@/domain/types'

export function JourneyTable({ journeys, snapshot, view = 'journeys' }: { journeys: readonly Journey[]; snapshot: AppSnapshot; view?: 'journeys' | 'segments' }) {
  if (!journeys.length) return <div className="empty-state"><Icon name="trip" size={28}/><strong>No hay viajes para estos filtros</strong><p>Prueba otro periodo o revisa la bandeja de importación.</p></div>
  if (view === 'segments') {
    const segments = journeys.flatMap((journey) => deriveSegments(journey, snapshot.stops).map((segment) => ({ journey, segment })))
    return <div className="table-wrap"><table className="data-table"><thead><tr><th>Viaje / tramo</th><th>Origen</th><th>Destino</th><th>Horario</th><th>Unidad</th><th>Estado</th><th/></tr></thead><tbody>{segments.map(({ journey, segment }) => {
      const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
      const state = getJourneyState(journey, snapshot.evidence)
      return <tr key={segment.id}><td><strong>{journey.externalId ?? journey.id.slice(0, 8)}</strong><small>Tramo {segment.sequence}</small></td><td>{segment.origin}</td><td>{segment.destination}</td><td className="mono"><small>{formatDateTime(segment.startedAt)}</small><small>{formatDateTime(segment.endedAt)}</small></td><td><strong>{vehicle?.plate ?? 'Sin unidad'}</strong><small>{vehicle?.name}</small></td><td><Badge tone={state.tone}>{state.label}</Badge></td><td><Link className="table-link" href={`/viajes/${journey.id}`}>Abrir <Icon name="arrow" size={14}/></Link></td></tr>
    })}</tbody></table></div>
  }
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Recorrido</th><th>Proyecto / ingeniero</th><th>Inicio</th><th>Distancia</th><th>Odómetro</th><th>Estado</th><th/></tr></thead><tbody>{journeys.map((journey) => {
    const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
    const project = snapshot.projects.find((item) => item.id === journey.projectId)
    const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
    const state = getJourneyState(journey, snapshot.evidence)
    const pair = evidenceForJourney(snapshot.evidence, journey.id)
    return <tr key={journey.id}><td><strong>{vehicle?.plate ?? 'Sin unidad'}</strong><small>{journey.origin ?? 'Origen pendiente'} → {journey.destination ?? 'En recorrido'}</small></td><td><strong>{project?.code ?? 'Sin asignar'}</strong><small>{engineer?.fullName ?? 'Ingeniero pendiente'}</small></td><td className="mono">{formatDateTime(journey.actualStart ?? journey.plannedStart)}</td><td className="mono">{formatKm(journey.gpsDistanceKm)}</td><td><strong className="mono">{pair.before ? pair.before.readingKm.toLocaleString('es-MX') : '—'} / {pair.after ? pair.after.readingKm.toLocaleString('es-MX') : '—'}</strong><small>Inicial / final</small></td><td><Badge tone={state.tone}>{state.label}</Badge></td><td><Link className="table-link" href={`/viajes/${journey.id}`}>Detalle <Icon name="arrow" size={14}/></Link></td></tr>
  })}</tbody></table></div>
}
