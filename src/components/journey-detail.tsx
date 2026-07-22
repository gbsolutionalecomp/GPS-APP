'use client'

import Link from 'next/link'
import { AssignmentForm } from '@/components/assignment-form'
import { EvidencePanel } from '@/components/evidence-panel'
import { useApp } from '@/components/app-provider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { ODOMETER_GPS_TOLERANCE_KM, calculateOdometerDelta, deriveSegments, evidenceForJourney, getJourneyState } from '@/domain/journeys'
import { formatDateTime, formatKm } from '@/domain/format'

export function JourneyDetail({ journeyId }: { journeyId: string }) {
  const { snapshot } = useApp()
  const journey = snapshot.journeys.find((item) => item.id === journeyId)
  if (!journey) return <div className="state-page"><span>Viaje no localizado</span><h1>No existe este recorrido</h1><p>Puede haber sido filtrado por tus permisos o todavía no se ha sincronizado.</p><Link className="button button--secondary" href="/">Volver al panel</Link></div>
  const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
  const project = snapshot.projects.find((item) => item.id === journey.projectId)
  const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
  const state = getJourneyState(journey, snapshot.evidence)
  const pair = evidenceForJourney(snapshot.evidence, journey.id)
  const odometerKm = calculateOdometerDelta(pair.before, pair.after)
  const difference = odometerKm !== null && journey.gpsDistanceKm !== undefined ? Math.round((odometerKm - journey.gpsDistanceKm) * 10) / 10 : null
  const segments = deriveSegments(journey, snapshot.stops)
  const stops = snapshot.stops.filter((item) => item.journeyId === journey.id).sort((a, b) => a.sequence - b.sequence)
  return <>
    <PageHeader actions={<Link className="button button--secondary" href={snapshot.currentUser.role === 'engineer' ? '/mis-viajes' : '/viajes'}>Volver a viajes</Link>} description={`${vehicle?.name ?? 'Unidad pendiente'} · ${journey.externalId ?? 'Viaje programado'}`} eyebrow="Expediente del recorrido" title={`${journey.origin ?? 'Origen pendiente'} → ${journey.destination ?? 'En recorrido'}`}/>
    <div className="metrics-grid"><div className="metric-card"><div className="metric-card__top"><span>Estado</span><Icon name="trip"/></div><strong style={{ fontFamily: 'inherit', fontSize: 19, letterSpacing: '-.025em' }}>{state.label}</strong><Badge tone={state.tone}>{state.lifecycle}</Badge></div><div className="metric-card"><div className="metric-card__top"><span>Distancia GPS</span><Icon name="location"/></div><strong>{formatKm(journey.gpsDistanceKm)}</strong><p>Dato reportado por la plataforma GPS</p></div><div className="metric-card"><div className="metric-card__top"><span>Distancia odómetro</span><Icon name="car"/></div><strong>{formatKm(odometerKm)}</strong><p>Lectura final menos inicial</p></div><div className={`metric-card ${difference !== null && Math.abs(difference) > ODOMETER_GPS_TOLERANCE_KM ? 'metric-card--warning' : 'metric-card--success'}`}><div className="metric-card__top"><span>Diferencia</span><Icon name="report"/></div><strong>{formatKm(difference)}</strong><p>Odómetro menos GPS · tolerancia ±{ODOMETER_GPS_TOLERANCE_KM} km</p></div></div>
    <div className="content-grid"><div className="stack"><Card title="Fotos del odómetro" subtitle="Las dos fotografías de este recorrido"><EvidencePanel journey={journey}/></Card><Card title="Paradas y tramos" subtitle={`${stops.length} paradas · ${segments.length} tramos`}><ol className="timeline"><li><span className="timeline__dot"/><div><strong>{journey.origin ?? 'Origen pendiente'}</strong><span>Inicio del recorrido</span></div><time>{formatDateTime(journey.actualStart ?? journey.plannedStart)}</time></li>{stops.map((stop) => <li key={stop.id}><span className="timeline__dot"/><div><strong>{stop.location}</strong><span>Parada de {stop.durationMinutes} minutos</span></div><time>{formatDateTime(stop.arrivedAt)}</time></li>)}<li><span className="timeline__dot"/><div><strong>{journey.destination ?? 'Destino pendiente'}</strong><span>{journey.actualEnd ? 'Recorrido finalizado' : 'Vehículo en movimiento'}</span></div><time>{formatDateTime(journey.actualEnd ?? journey.plannedEnd)}</time></li></ol></Card></div><div className="stack"><Card title="Asignación" subtitle="Proyecto, unidad y responsable"><dl className="summary-grid" style={{ gridTemplateColumns: '1fr' }}><div className="summary-box"><span>Proyecto</span><strong>{project ? `${project.code} · ${project.name}` : 'Sin asignar'}</strong></div><div className="summary-box"><span>Ingeniero</span><strong>{engineer?.fullName ?? 'Sin asignar'}</strong></div><div className="summary-box"><span>Vehículo</span><strong>{vehicle ? `${vehicle.plate} · ${vehicle.name}` : 'Sin unidad'}</strong></div></dl></Card>{snapshot.currentUser.role === 'admin' ? <Card title="Cambiar asignación" subtitle="Los cambios quedan registrados"><AssignmentForm journey={journey}/></Card> : null}<Card title="Trazabilidad" subtitle="Fuente y actualización"><dl className="summary-grid" style={{ gridTemplateColumns: '1fr' }}><div className="summary-box"><span>Fuente</span><strong>{journey.source.replaceAll('_', ' ')}</strong></div><div className="summary-box"><span>ID externo</span><strong>{journey.externalId ?? 'Pendiente de la plataforma GPS'}</strong></div><div className="summary-box"><span>Actualizado</span><strong>{formatDateTime(journey.sourceUpdatedAt ?? journey.updatedAt)}</strong></div></dl></Card></div></div>
  </>
}
