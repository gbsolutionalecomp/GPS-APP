'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/components/app-provider'
import { JourneyTable } from '@/components/journey-table'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { getJourneyState } from '@/domain/journeys'

export default function MyJourneysPage() {
  const { snapshot } = useApp()
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  const journeys = useMemo(() => snapshot.journeys.filter((journey) => journey.engineerId === snapshot.currentUser.id).filter((journey) => filter === 'all' || getJourneyState(journey, snapshot.evidence).workflow !== 'complete'), [snapshot, filter])
  return <><PageHeader description="Toma o sube las fotografías del odómetro inicial y final de cada recorrido asignado." eyebrow="Operación móvil" title="Mis viajes"/><div className="filter-bar"><div aria-label="Filtrar mis viajes" className="segmented"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')} type="button">Todos</button><button aria-pressed={filter === 'pending'} onClick={() => setFilter('pending')} type="button">Por completar</button></div></div><Card className="card--flush" subtitle={`${journeys.length} recorridos asignados`} title="Bandeja personal"><JourneyTable journeys={journeys} snapshot={snapshot}/></Card></>
}
