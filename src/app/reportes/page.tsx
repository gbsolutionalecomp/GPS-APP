'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/components/app-provider'
import { JourneyTable } from '@/components/journey-table'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { getJourneyState, isJourneyInMonth } from '@/domain/journeys'

const currentMonth = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7)

export default function ReportsPage() {
  const { snapshot } = useApp()
  const [month, setMonth] = useState(currentMonth)
  const [projectId, setProjectId] = useState('all')
  const [vehicleId, setVehicleId] = useState('all')
  const [engineerId, setEngineerId] = useState('all')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState<'journeys' | 'segments'>('journeys')
  const journeys = useMemo(() => snapshot.journeys.filter((journey) => isJourneyInMonth(journey, month)).filter((journey) => projectId === 'all' || journey.projectId === projectId).filter((journey) => vehicleId === 'all' || journey.vehicleId === vehicleId).filter((journey) => engineerId === 'all' || journey.engineerId === engineerId).filter((journey) => status === 'all' || getJourneyState(journey, snapshot.evidence).workflow === status), [snapshot, month, projectId, vehicleId, engineerId, status])
  const params = new URLSearchParams({ month, projectId, vehicleId, engineerId, status })
  return <><PageHeader actions={<><a className="button button--secondary" href={`/api/reportes/mensual/pdf?${params}`}><Icon name="download" size={15}/>Descargar PDF</a><a className="button button--primary" href={`/api/reportes/mensual/xlsx?${params}`}><Icon name="download" size={15}/>Descargar Excel</a></>} description="Todos los recorridos del periodo aparecen, incluyendo los que todavía tienen fotos o lecturas pendientes." eyebrow="Cierre operativo" title="Reporte mensual"/><div className="filter-bar"><label className="field"><input aria-label="Mes del reporte" onChange={(event) => setMonth(event.target.value)} type="month" value={month}/></label><label className="field"><select aria-label="Proyecto" onChange={(event) => setProjectId(event.target.value)} value={projectId}><option value="all">Todos los proyectos</option>{snapshot.projects.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label className="field"><select aria-label="Vehículo" onChange={(event) => setVehicleId(event.target.value)} value={vehicleId}><option value="all">Todos los vehículos</option>{snapshot.vehicles.map((item) => <option key={item.id} value={item.id}>{item.plate}</option>)}</select></label><label className="field"><select aria-label="Ingeniero" onChange={(event) => setEngineerId(event.target.value)} value={engineerId}><option value="all">Todos los ingenieros</option>{snapshot.profiles.filter((item) => item.role === 'engineer').map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label><label className="field"><select aria-label="Estado documental" onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">Todos los estados</option><option value="unassigned">Sin asignar</option><option value="pending_evidence">Pendientes</option><option value="complete">Completos</option></select></label><div className="segmented"><button aria-pressed={view === 'journeys'} onClick={() => setView('journeys')} type="button">Recorridos</button><button aria-pressed={view === 'segments'} onClick={() => setView('segments')} type="button">Tramos</button></div></div><div className="summary-grid" style={{ marginBottom: 15 }}><div className="summary-box"><span>Recorridos</span><strong>{journeys.length}</strong></div><div className="summary-box"><span>Distancia GPS</span><strong>{journeys.reduce((sum, item) => sum + (item.gpsDistanceKm ?? 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 1 })} km</strong></div><div className="summary-box"><span>Con evidencia completa</span><strong>{journeys.filter((item) => getJourneyState(item, snapshot.evidence).workflow === 'complete').length}</strong></div></div><Card className="card--flush" subtitle="La descarga respeta estos mismos filtros" title={view === 'journeys' ? 'Vista de recorridos' : 'Vista de tramos'}><JourneyTable journeys={journeys} snapshot={snapshot} view={view}/></Card></>
}
