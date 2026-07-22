import { describe, expect, it } from 'vitest'
import { demoSnapshot } from '@/data/demo'
import type { Journey } from './types'
import { calculateOdometerDelta, deriveSegments, getJourneyState, isJourneyInMonth, odometerMatchesGps } from './journeys'

describe('estado y cálculo de recorridos', () => {
  it('marca un recorrido con dos lecturas válidas como completo', () => {
    const journey = demoSnapshot.journeys.find((item) => item.id === 'journey-complete')!
    expect(getJourneyState(journey, demoSnapshot.evidence).workflow).toBe('complete')
    const evidence = demoSnapshot.evidence.filter((item) => item.journeyId === journey.id)
    expect(calculateOdometerDelta(evidence.find((item) => item.kind === 'before'), evidence.find((item) => item.kind === 'after'))).toBe(88)
  })

  it('no calcula diferencia cuando el odómetro final retrocede', () => {
    expect(calculateOdometerDelta({ readingKm: 120 } as never, { readingKm: 119 } as never)).toBeNull()
  })

  it('deriva tramos sin duplicar las evidencias del recorrido', () => {
    const journey = demoSnapshot.journeys.find((item) => item.id === 'journey-complete')!
    const segments = deriveSegments(journey, demoSnapshot.stops)
    expect(segments).toHaveLength(3)
    expect(segments[0]).toMatchObject({ origin: 'Oficinas GBS Monterrey', destination: 'Torre Centro · Acceso principal' })
    expect(segments[2]?.destination).toBe('Oficinas GBS Monterrey')
  })

  it('agrupa el mes con la zona horaria de México', () => {
    expect(isJourneyInMonth(demoSnapshot.journeys[1]!, '2026-07')).toBe(true)
    expect(isJourneyInMonth(demoSnapshot.journeys[1]!, '2026-06')).toBe(false)
  })

  it('mantiene completo un recorrido cuando la diferencia GPS/odómetro está dentro de la tolerancia', () => {
    const journey = demoSnapshot.journeys.find((item) => item.id === 'journey-complete')!
    expect(journey.gpsDistanceKm).toBe(86.4)
    const evidence = demoSnapshot.evidence.filter((item) => item.journeyId === journey.id)
    expect(calculateOdometerDelta(evidence.find((item) => item.kind === 'before'), evidence.find((item) => item.kind === 'after'))).toBe(88)
    expect(getJourneyState(journey, evidence).workflow).toBe('complete')
  })

  it('marca "por corregir" un recorrido cuando el odómetro no coincide con el GPS más allá de la tolerancia', () => {
    const journey = demoSnapshot.journeys.find((item) => item.id === 'journey-complete')!
    const mismatched: Journey = { ...journey, gpsDistanceKm: 50 }
    const evidence = demoSnapshot.evidence.filter((item) => item.journeyId === journey.id)
    const state = getJourneyState(mismatched, evidence)
    expect(state.workflow).toBe('pending_evidence')
    expect(state.label).toBe('Odómetro no coincide con GPS')
  })

  it('odometerMatchesGps es permisivo cuando falta el odómetro o el dato de GPS', () => {
    expect(odometerMatchesGps(null, 50)).toBe(true)
    expect(odometerMatchesGps(88, undefined)).toBe(true)
    expect(odometerMatchesGps(88, 86.4)).toBe(true)
    expect(odometerMatchesGps(88, 50)).toBe(false)
  })
})
