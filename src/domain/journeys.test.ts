import { describe, expect, it } from 'vitest'
import type { Journey, OdometerEvidence, JourneyStop } from './types'
import { calculateOdometerDelta, deriveSegments, getJourneyState, isJourneyInMonth, odometerMatchesGps } from './journeys'

const testJourney: Journey = {
  id: 'journey-complete',
  externalId: 'LOC-20260718-014',
  source: 'locatelia_webhook',
  vehicleId: 'vehicle-1',
  projectId: 'project-centro',
  engineerId: 'profile-engineer-1',
  actualStart: '2026-07-18T14:06:00.000Z',
  actualEnd: '2026-07-18T20:31:00.000Z',
  origin: 'Oficinas GBS Monterrey',
  destination: 'Oficinas GBS Monterrey',
  gpsDistanceKm: 86.4,
  createdAt: '2026-07-18T14:06:00.000Z',
  updatedAt: '2026-07-18T20:40:00.000Z',
}

const testEvidence: OdometerEvidence[] = [
  { id: 'ev-1', journeyId: 'journey-complete', kind: 'before', readingKm: 47980, photoUrl: '', uploadedBy: 'p1', uploadedAt: '2026-07-18T13:58:00.000Z' },
  { id: 'ev-2', journeyId: 'journey-complete', kind: 'after', readingKm: 48068, photoUrl: '', uploadedBy: 'p1', uploadedAt: '2026-07-18T20:38:00.000Z' },
]

const testStops: JourneyStop[] = [
  { id: 'stop-1', journeyId: 'journey-complete', sequence: 1, arrivedAt: '2026-07-18T15:04:00.000Z', departedAt: '2026-07-18T15:45:00.000Z', location: 'Torre Centro · Acceso principal', durationMinutes: 41 },
  { id: 'stop-2', journeyId: 'journey-complete', sequence: 2, arrivedAt: '2026-07-18T17:20:00.000Z', departedAt: '2026-07-18T18:05:00.000Z', location: 'Proveedor eléctrico San Jerónimo', durationMinutes: 45 },
]

describe('estado y cálculo de recorridos', () => {
  it('marca un recorrido con dos lecturas válidas como completo', () => {
    expect(getJourneyState(testJourney, testEvidence).workflow).toBe('complete')
    expect(calculateOdometerDelta(testEvidence[0], testEvidence[1])).toBe(88)
  })

  it('no calcula diferencia cuando el odómetro final retrocede', () => {
    expect(calculateOdometerDelta({ readingKm: 120 } as never, { readingKm: 119 } as never)).toBeNull()
  })

  it('deriva tramos sin duplicar las evidencias del recorrido', () => {
    const segments = deriveSegments(testJourney, testStops)
    expect(segments).toHaveLength(3)
    expect(segments[0]).toMatchObject({ origin: 'Oficinas GBS Monterrey', destination: 'Torre Centro · Acceso principal' })
    expect(segments[2]?.destination).toBe('Oficinas GBS Monterrey')
  })

  it('agrupa el mes con la zona horaria de México', () => {
    expect(isJourneyInMonth(testJourney, '2026-07')).toBe(true)
    expect(isJourneyInMonth(testJourney, '2026-06')).toBe(false)
  })

  it('mantiene completo un recorrido cuando la diferencia GPS/odómetro está dentro de la tolerancia', () => {
    expect(testJourney.gpsDistanceKm).toBe(86.4)
    expect(calculateOdometerDelta(testEvidence[0], testEvidence[1])).toBe(88)
    expect(getJourneyState(testJourney, testEvidence).workflow).toBe('complete')
  })

  it('marca "por corregir" un recorrido cuando el odómetro no coincide con el GPS más allá de la tolerancia', () => {
    const mismatched: Journey = { ...testJourney, gpsDistanceKm: 50 }
    const state = getJourneyState(mismatched, testEvidence)
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

