'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useApp } from '@/components/app-provider'
import { JourneyTable } from '@/components/journey-table'
import { ScheduleJourneyForm } from '@/components/schedule-journey-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { getJourneyState } from '@/domain/journeys'

export default function JourneysPage() {
  const { snapshot } = useApp()
  const search = useSearchParams()
  const [view, setView] = useState<'journeys' | 'segments'>('journeys')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [scheduling, setScheduling] = useState(search.get('programar') === '1')
  const journeys = useMemo(() => snapshot.journeys.filter((journey) => {
    const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
    const project = snapshot.projects.find((item) => item.id === journey.projectId)
    const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
    const haystack = [vehicle?.plate, vehicle?.name, project?.code, project?.name, engineer?.fullName, journey.origin, journey.destination, journey.externalId].join(' ').toLowerCase()
    const state = getJourneyState(journey, snapshot.evidence)
    return haystack.includes(query.toLowerCase()) && (status === 'all' || state.lifecycle === status || state.workflow === status)
  }), [snapshot, query, status])
  return <>
    <PageHeader actions={<Button onClick={() => setScheduling((value) => !value)} type="button" variant={scheduling ? 'secondary' : 'primary'}><Icon name="calendar" size={15}/>{scheduling ? 'Cerrar' : 'Programar viaje'}</Button>} description="Consulta cada recorrido, prográmalos con anticipación y desglósalos en tramos entre paradas." eyebrow="Bitácora GPS" title="Viajes"/>
    {scheduling ? <Card subtitle="Se vincula solo si hay una única coincidencia de vehículo y ventana" title="Programar viaje"><ScheduleJourneyForm onDone={() => setScheduling(false)}/></Card> : null}
    <div className="filter-bar"><label className="search-field"><Icon name="trip" size={15}/><input aria-label="Buscar viajes" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar placa, proyecto, ingeniero u origen…" value={query}/></label><label className="field"><select aria-label="Filtrar por estado" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">Todos los estados</option><option value="active">Activos</option><option value="unassigned">Sin asignar</option><option value="pending_evidence">Evidencia pendiente</option><option value="complete">Completos</option></select></label><div aria-label="Nivel de detalle" className="segmented"><button aria-pressed={view === 'journeys'} onClick={() => setView('journeys')} type="button">Recorridos</button><button aria-pressed={view === 'segments'} onClick={() => setView('segments')} type="button">Tramos</button></div></div>
    <Card className="card--flush" subtitle={`${journeys.length} registros visibles`} title={view === 'journeys' ? 'Recorridos completos' : 'Tramos entre paradas'}><JourneyTable journeys={journeys} snapshot={snapshot} view={view}/></Card>
  </>
}
