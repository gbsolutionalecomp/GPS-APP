'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useApp } from '@/components/app-provider'
import { JourneyTable } from '@/components/journey-table'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { getJourneyState } from '@/domain/journeys'

export default function DashboardPage() {
  const { snapshot } = useApp()
  const router = useRouter()
  const isEngineer = snapshot.currentUser.role === 'engineer'

  // Los ingenieros sólo trabajan desde Mis viajes: el panel operativo es una vista de administración.
  useEffect(() => {
    if (isEngineer) router.replace('/mis-viajes')
  }, [isEngineer, router])
  if (isEngineer) return null

  const scoped = snapshot.journeys
  const states = scoped.map((journey) => getJourneyState(journey, snapshot.evidence))
  const active = states.filter((state) => state.lifecycle === 'active').length
  const unassigned = states.filter((state) => state.workflow === 'unassigned').length
  const pending = states.filter((state) => state.workflow === 'pending_evidence').length
  const complete = states.filter((state) => state.workflow === 'complete').length
  return <><PageHeader actions={<Link className="button button--primary" href="/viajes?programar=1"><Icon name="calendar" size={16}/>Programar viaje</Link>} description="Seguimiento de unidades, asignaciones y fotos pendientes en una sola vista." eyebrow="Operación de campo" title="Control de viajes y GPS"/><div className="metrics-grid"><MetricCard detail="Recorridos transmitiendo" icon="sync" label="Activos ahora" tone="success" value={active}/><MetricCard detail="Requieren proyecto e ingeniero" icon="user" label="Sin asignar" tone="danger" value={unassigned}/><MetricCard detail="Falta una o ambas fotografías" icon="camera" label="Pendientes de evidencia" tone="warning" value={pending}/><MetricCard detail="Con odómetro inicial y final" icon="check" label="Completos" tone="info" value={complete}/></div><div className="content-grid"><Card action={<Link className="table-link" href="/viajes">Ver todos <Icon name="arrow" size={14}/></Link>} className="card--flush" subtitle="Ordenados por actividad reciente" title="Actividad reciente"><JourneyTable journeys={scoped.slice(0, 5)} snapshot={snapshot}/></Card><div className="stack"><Card title="Plataforma GPS" subtitle="Sincronización y respaldo"><div className="integration-status"><span className="integration-status__icon"><Icon name="sync" size={24}/></span><div><h2>{snapshot.integration.mode === 'disabled' ? 'Pendiente de conectar' : 'Servicio disponible'}</h2><p>{snapshot.integration.mode === 'disabled' ? 'Sube el archivo de recorridos mientras se activa la conexión automática.' : `Sincronización automática cada ${snapshot.integration.pollIntervalMinutes} min`}</p></div></div></Card><Card title="Reglas de control" subtitle="Criterios aplicados automáticamente"><div className="notice"><Icon name="check"/><div><strong>Un viaje, dos fotos</strong><span>Las fotografías pertenecen al recorrido y no se duplican por tramo.</span></div></div><div className="notice notice--warning" style={{ marginTop: 9 }}><Icon name="warning"/><div><strong>Ningún viaje se oculta</strong><span>Los incompletos también aparecen en el reporte mensual.</span></div></div></Card></div></div></>
}
