import { randomUUID } from 'node:crypto'
import type { JourneyStop } from '@/domain/types'
import type { LocateliaAdapter, LocateliaDirectory, NormalizedLocateliaBatch } from './contracts'
import { journeyFingerprint } from './fingerprint'

const aliases = {
  externalId: ['id', 'id viaje', 'id recorrido', 'trip id', 'viaje', 'folio', 'referencia'],
  plate: ['placa', 'matricula', 'matrícula', 'vehicle', 'vehiculo', 'vehículo', 'unidad'],
  deviceId: ['id dispositivo', 'device id', 'gps id', 'localizador'],
  actualStart: ['inicio', 'fecha inicio', 'hora inicio', 'start', 'fecha salida', 'salida'],
  actualEnd: ['fin', 'fecha fin', 'hora fin', 'end', 'fecha llegada', 'llegada'],
  origin: ['origen', 'ubicacion inicial', 'ubicación inicial', 'punto inicial'],
  destination: ['destino', 'ubicacion final', 'ubicación final', 'punto final'],
  distance: ['km', 'kilometros', 'kilómetros', 'distancia', 'distance', 'km recorridos'],
  stops: ['paradas', 'stops', 'detalle paradas'],
} as const

function normalizeHeader(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function field(row: Record<string, unknown>, key: keyof typeof aliases): string {
  const wanted = new Set(aliases[key].map(normalizeHeader))
  const entry = Object.entries(row).find(([header]) => wanted.has(normalizeHeader(header)))
  return String(entry?.[1] ?? '').trim()
}

function parseDistance(raw: string): number | undefined {
  const normalized = raw.replace(/\s|km/gi, '').replaceAll(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : undefined
}

function parseDate(raw: string): string | undefined {
  if (!raw) return undefined
  const latin = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (latin) {
    const local = `${latin[3]}-${latin[2]?.padStart(2, '0')}-${latin[1]?.padStart(2, '0')}T${(latin[4] ?? '00').padStart(2, '0')}:${latin[5] ?? '00'}:${latin[6] ?? '00'}-06:00`
    const parsed = new Date(local)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

function parseStops(raw: string, journeyId: string): JourneyStop[] {
  if (!raw) return []
  const stops: JourneyStop[] = []
  raw.split(';').forEach((entry, index) => {
    const [location = '', arrived = '', departed = ''] = entry.split('|').map((item) => item?.trim() ?? '')
    const arrivedAt = parseDate(arrived)
    const departedAt = parseDate(departed)
    if (!location || !arrivedAt) return
    const durationMinutes = departedAt ? Math.max(0, Math.round((new Date(departedAt).getTime() - new Date(arrivedAt).getTime()) / 60_000)) : 0
    stops.push({ id: randomUUID(), journeyId, sequence: index + 1, arrivedAt, departedAt, location, durationMinutes })
  })
  return stops
}

export class DefaultLocateliaAdapter implements LocateliaAdapter {
  async normalize(records: readonly Record<string, unknown>[], directory: LocateliaDirectory): Promise<NormalizedLocateliaBatch> {
    const journeys: NormalizedLocateliaBatch['journeys'] = []
    const stops: JourneyStop[] = []
    const warnings: string[] = []
    const errors: string[] = []
    records.forEach((row, index) => {
      const plate = field(row, 'plate').toUpperCase().replace(/\s/g, '')
      const deviceId = field(row, 'deviceId')
      const vehicle = directory.vehicles.find((item) => item.plate.toUpperCase().replace(/\s/g, '') === plate || (deviceId && item.locateliaDeviceId === deviceId))
      const actualStart = parseDate(field(row, 'actualStart'))
      const actualEnd = parseDate(field(row, 'actualEnd'))
      if (!vehicle || !actualStart) {
        errors.push(`Fila ${index + 2}: requiere un vehículo conocido y una fecha de inicio válida.`)
        return
      }
      if (actualEnd && new Date(actualEnd) < new Date(actualStart)) {
        errors.push(`Fila ${index + 2}: la fecha final es anterior al inicio.`)
        return
      }
      const id = randomUUID()
      const gpsDistanceKm = parseDistance(field(row, 'distance'))
      const externalId = field(row, 'externalId') || undefined
      const fingerprint = externalId ? undefined : journeyFingerprint({ vehicleId: vehicle.id, actualStart, actualEnd, gpsDistanceKm })
      const now = new Date().toISOString()
      journeys.push({
        id, externalId, fingerprint, source: 'locatelia_import', vehicleId: vehicle.id, actualStart, actualEnd,
        origin: field(row, 'origin') || undefined, destination: field(row, 'destination') || undefined,
        gpsDistanceKm, sourceUpdatedAt: now, createdAt: now, updatedAt: now,
      })
      stops.push(...parseStops(field(row, 'stops'), id))
      if (!externalId) warnings.push(`Fila ${index + 2}: sin ID externo; se generó una huella SHA-256.`)
    })
    return { journeys, stops, warnings: [...new Set(warnings)], errors }
  }
}
