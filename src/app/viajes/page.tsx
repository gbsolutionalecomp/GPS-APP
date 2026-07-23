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
import { getMonthKeyAndLabel, getISOWeekNumber } from '@/domain/format'

export default function JourneysPage() {
  const { snapshot } = useApp()
  const search = useSearchParams()
  const [view, setView] = useState<'journeys' | 'segments'>('journeys')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc')
  const [scheduling, setScheduling] = useState(search.get('programar') === '1')

  // Obtener lista de meses únicos ordenados recíprocamente
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { key: string; label: string; count: number }>()
    snapshot.journeys.forEach((journey) => {
      const dateStr = journey.actualStart ?? journey.plannedStart
      const { key, label } = getMonthKeyAndLabel(dateStr)
      const existing = monthMap.get(key)
      if (existing) {
        existing.count += 1
      } else {
        monthMap.set(key, { key, label, count: 1 })
      }
    })
    const list = Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key))
    return [{ key: 'all', label: 'Todos los periodos', count: snapshot.journeys.length }, ...list]
  }, [snapshot.journeys])

  // Obtener semanas disponibles dentro del mes seleccionado
  const availableWeeks = useMemo(() => {
    const weekSet = new Set<number>()
    snapshot.journeys.forEach((journey) => {
      const dateStr = journey.actualStart ?? journey.plannedStart
      const { key } = getMonthKeyAndLabel(dateStr)
      if (selectedMonth === 'all' || key === selectedMonth) {
        const wNum = getISOWeekNumber(dateStr)
        if (wNum > 0) weekSet.add(wNum)
      }
    })
    return Array.from(weekSet).sort((a, b) => a - b)
  }, [snapshot.journeys, selectedMonth])

  // Filtrado final de viajes
  const journeys = useMemo(() => {
    const filtered = snapshot.journeys.filter((journey) => {
      const dateStr = journey.actualStart ?? journey.plannedStart
      const { key: mKey } = getMonthKeyAndLabel(dateStr)
      const wNum = getISOWeekNumber(dateStr)

      // Filtro por Mes
      if (selectedMonth !== 'all' && mKey !== selectedMonth) return false

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
    if (selectedMonth === 'all') return 'Todos los periodos'
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
        description="Consulta cada recorrido clasificado por meses y semanas de carga estilo estado de cuenta bancario."
        eyebrow="Bitácora GPS por Periodo"
        title="Viajes"
      />

      {scheduling ? (
        <Card subtitle="Se vincula solo si hay una única coincidencia de vehículo y ventana" title="Programar viaje">
          <ScheduleJourneyForm onDone={() => setScheduling(false)} />
        </Card>
      ) : null}

      {/* CLASIFICACIÓN POR MES - ESTILO ESTADO DE CUENTA BANCARIO */}
      <div className="card" style={{ marginBottom: '14px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="calendar" size={14} /> Seleccionar periodo mensual (Estado de cuenta)
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {journeys.length} recorridos en {activeMonthLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {availableMonths.map((month) => {
            const isSelected = selectedMonth === month.key
            return (
              <button
                key={month.key}
                type="button"
                onClick={() => { setSelectedMonth(month.key); setSelectedWeek('all') }}
                style={{
                  background: isSelected ? '#18181b' : 'var(--surface-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text)',
                  border: '1px solid ' + (isSelected ? '#18181b' : 'var(--border)'),
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{month.label}</span>
                <span
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '10px',
                  }}
                >
                  {month.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* BARRA DE FILTROS SECTORIALES */}
      <div className="filter-bar">
        <label className="search-field">
          <Icon name="trip" size={15} />
          <input aria-label="Buscar viajes" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por lugar (ej. Cerritos, Secovi, Manuel Casa)…" value={query} />
        </label>

        {/* Filtro por Semana de Carga */}
        <label className="field">
          <select aria-label="Filtrar por semana" onChange={(event) => setSelectedWeek(event.target.value)} value={selectedWeek}>
            <option value="all">Todas las semanas</option>
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
    </>
  )
}
