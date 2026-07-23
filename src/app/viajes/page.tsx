'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useApp } from '@/components/app-provider'
import { JourneyTable } from '@/components/journey-table'
import { ScheduleJourneyForm } from '@/components/schedule-journey-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { getJourneyState } from '@/domain/journeys'
import { getMonthKeyAndLabel, getISOWeekNumber } from '@/domain/format'

export default function JourneysPage() {
  const { snapshot } = useApp()
  const search = useSearchParams()
  const [view, setView] = useState<'journeys' | 'segments'>('journeys')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc')
  const [scheduling, setScheduling] = useState(search.get('programar') === '1')

  // Obtener lista de meses únicos ordenados recíprocamente con conteo de cargas semanales
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { key: string; label: string; count: number; weeks: Set<number> }>()
    snapshot.journeys.forEach((journey) => {
      const dateStr = journey.actualStart ?? journey.plannedStart
      const { key, label } = getMonthKeyAndLabel(dateStr)
      const wNum = getISOWeekNumber(dateStr)
      const existing = monthMap.get(key)
      if (existing) {
        existing.count += 1
        if (wNum > 0) existing.weeks.add(wNum)
      } else {
        const weeks = new Set<number>()
        if (wNum > 0) weeks.add(wNum)
        monthMap.set(key, { key, label, count: 1, weeks })
      }
    })
    return Array.from(monthMap.values())
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((item) => ({ key: item.key, label: item.label, count: item.count, weekCount: item.weeks.size }))
  }, [snapshot.journeys])

  // Obtener semanas disponibles dentro del mes seleccionado
  const availableWeeks = useMemo(() => {
    if (!selectedMonth) return []
    const weekSet = new Set<number>()
    snapshot.journeys.forEach((journey) => {
      const dateStr = journey.actualStart ?? journey.plannedStart
      const { key } = getMonthKeyAndLabel(dateStr)
      if (key === selectedMonth) {
        const wNum = getISOWeekNumber(dateStr)
        if (wNum > 0) weekSet.add(wNum)
      }
    })
    return Array.from(weekSet).sort((a, b) => a - b)
  }, [snapshot.journeys, selectedMonth])

  // Filtrado final de viajes para el mes seleccionado
  const journeys = useMemo(() => {
    if (!selectedMonth) return []
    const filtered = snapshot.journeys.filter((journey) => {
      const dateStr = journey.actualStart ?? journey.plannedStart
      const { key: mKey } = getMonthKeyAndLabel(dateStr)
      const wNum = getISOWeekNumber(dateStr)

      // Filtro por Mes
      if (mKey !== selectedMonth) return false

      // Filtro por Semana
      if (selectedWeek !== 'all' && String(wNum) !== selectedWeek) return false

      // Filtro de Texto
      const vehicle = snapshot.vehicles.find((item) => item.id === journey.vehicleId)
      const project = snapshot.projects.find((item) => item.id === journey.projectId)
      const engineer = snapshot.profiles.find((item) => item.id === journey.engineerId)
      const haystack = [vehicle?.plate, vehicle?.name, project?.code, project?.name, engineer?.fullName, journey.origin, journey.destination, journey.externalId].join(' ').toLowerCase()
      if (query && !haystack.includes(query.toLowerCase())) return false

      // Filtro de Estado
      const state = getJourneyState(journey, snapshot.evidence)
      if (status !== 'all' && state.lifecycle !== status && state.workflow !== status) return false

      return true
    })

    return filtered.sort((a, b) => {
      const timeA = new Date(a.actualStart ?? a.plannedStart ?? 0).getTime()
      const timeB = new Date(b.actualStart ?? b.plannedStart ?? 0).getTime()
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })
  }, [snapshot, query, status, selectedMonth, selectedWeek, sortOrder])

  // Etiqueta del mes activo seleccionado
  const activeMonthLabel = useMemo(() => {
    if (!selectedMonth) return ''
    return availableMonths.find((m) => m.key === selectedMonth)?.label ?? selectedMonth
  }, [availableMonths, selectedMonth])

  return (
    <>
      <PageHeader
        actions={
          <Button onClick={() => setScheduling((value) => !value)} type="button" variant={scheduling ? 'secondary' : 'primary'}>
            <Icon name="calendar" size={15} />
            {scheduling ? 'Cerrar' : 'Programar viaje'}
          </Button>
        }
        description="Estados de cuenta mensuales de recorridos GPS subidos por administración."
        eyebrow="Bitácora GPS"
        title="Viajes"
      />

      {scheduling ? (
        <Card subtitle="Se vincula solo si hay una única coincidencia de vehículo y ventana" title="Programar viaje">
          <ScheduleJourneyForm onDone={() => setScheduling(false)} />
        </Card>
      ) : null}

      {/* VISTA 1: CATÁLOGO DE MESES (NO MUESTRA LA TABLA HASTA TOCAR UN MES) */}
      {!selectedMonth ? (
        <div className="stack">
          <div className="notice">
            <div>
              <strong>Selecciona un mes (Estado de cuenta)</strong>
              <span>Toca un periodo mensual para abrir su bitácora detallada de recorridos y cargas semanales.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginTop: '8px' }}>
            {availableMonths.map((month) => (
              <div
                key={month.key}
                className="card"
                onClick={() => setSelectedMonth(month.key)}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                      📅 {month.label}
                    </span>
                    <Badge tone="info">{month.count} viajes</Badge>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 16px', lineHeight: 1.4 }}>
                    Bitácora mensual con <strong>{month.weekCount} cargas semanales</strong> registradas por administración.
                  </p>
                </div>
                <Button type="button" variant="primary" style={{ width: '100%' }}>
                  Abrir reporte de {month.label} →
                </Button>
              </div>
            ))}

            {!availableMonths.length ? (
              <div className="empty-state">
                <Icon name="trip" size={28} />
                <strong>No hay periodos mensuales registrados</strong>
                <p>Sube archivos semanales desde la sección Subir Recorridos.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* VISTA 2: REPORTE ABIERTO DEL MES SELECCIONADO */
        <div className="stack">
          {/* BARRA DE NAVEGACIÓN DEL MES ABIERTO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', background: 'var(--surface)', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <Button onClick={() => { setSelectedMonth(null); setSelectedWeek('all'); setQuery(''); }} type="button" variant="secondary">
              ← Volver a Selección de Periodos
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                Periodo activo: <span style={{ textDecoration: 'underline' }}>{activeMonthLabel}</span>
              </span>
              <Badge tone="success">{journeys.length} recorridos</Badge>
            </div>
          </div>

          {/* BARRA DE FILTROS DEL MES */}
          <div className="filter-bar">
            <label className="search-field">
              <Icon name="trip" size={15} />
              <input aria-label="Buscar viajes" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lugar (ej. Cerritos, Secovi, Manuel Casa)…" value={query} />
            </label>

            {/* Filtro por Semana de Carga */}
            <label className="field">
              <select aria-label="Filtrar por semana" onChange={(event) => setSelectedWeek(event.target.value)} value={selectedWeek}>
                <option value="all">Todas las semanas del mes</option>
                {availableWeeks.map((wNum) => (
                  <option key={wNum} value={String(wNum)}>
                    Semana {wNum}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <select aria-label="Filtrar por estado" onChange={(event) => setStatus(event.target.value)} value={status}>
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="unassigned">Sin asignar</option>
                <option value="pending_evidence">Evidencia pendiente</option>
                <option value="complete">Completos</option>
              </select>
            </label>

            <label className="field">
              <select aria-label="Orden cronológico" onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')} value={sortOrder}>
                <option value="asc">Más antiguos primero (01 Jul → ...)</option>
                <option value="desc">Más recientes primero (... → 21 Jul)</option>
              </select>
            </label>

            <div aria-label="Nivel de detalle" className="segmented">
              <button aria-pressed={view === 'journeys'} onClick={() => setView('journeys')} type="button">
                Recorridos
              </button>
              <button aria-pressed={view === 'segments'} onClick={() => setView('segments')} type="button">
                Tramos
              </button>
            </div>
          </div>

          <Card
            className="card--flush"
            subtitle={`${journeys.length} registros en ${activeMonthLabel} ${selectedWeek !== 'all' ? `(Semana ${selectedWeek})` : ''}`}
            title={view === 'journeys' ? `Recorridos completos — ${activeMonthLabel}` : `Tramos entre paradas — ${activeMonthLabel}`}
          >
            <JourneyTable journeys={journeys} snapshot={snapshot} view={view} />
          </Card>
        </div>
      )}
    </>
  )
}
