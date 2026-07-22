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

function parseDate(raw: unknown): string | undefined {
  if (!raw) return undefined
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'number') {
    const date = new Date(Math.round((raw - (25567 + 2)) * 86400 * 1000))
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  const str = String(raw).trim()
  if (!str) return undefined
  const latin = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (latin) {
    const local = `${latin[3]}-${latin[2]?.padStart(2, '0')}-${latin[1]?.padStart(2, '0')}T${(latin[4] ?? '00').padStart(2, '0')}:${latin[5] ?? '00'}:${latin[6] ?? '00'}-06:00`
    const parsed = new Date(local)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
  }
  const iso = str.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (iso) {
    const local = `${iso[1]}-${iso[2]?.padStart(2, '0')}-${iso[3]?.padStart(2, '0')}T${(iso[4] ?? '00').padStart(2, '0')}:${iso[5] ?? '00'}:${iso[6] ?? '00'}-06:00`
    const parsed = new Date(local)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
  }
  const parsed = new Date(str)
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
      let rawPlate = field(row, 'plate') || String(row.vehicle ?? '').trim()
      const deviceId = field(row, 'deviceId')
      if (!rawPlate && !deviceId) {
        rawPlate = directory.vehicles[0]?.plate || 'UNIDAD-01'
      }
      const plate = rawPlate.toUpperCase().replace(/\s/g, '')

      let vehicle = directory.vehicles.find(
        (item) => item.plate.toUpperCase().replace(/\s/g, '') === plate || (deviceId && item.locateliaDeviceId === deviceId)
      )

      if (!vehicle) {
        vehicle = {
          id: randomUUID(),
          plate: plate || 'UNIDAD-01',
          name: `Unidad ${plate || '01'}`,
          locateliaDeviceId: deviceId || undefined,
          active: true,
        }
        directory.vehicles.push(vehicle)
        warnings.push(`Vehículo ${vehicle.plate} no estaba registrado; se dio de alta automáticamente.`)
      }

      const actualStart = parseDate(field(row, 'actualStart')) || parseDate(row.date ? `${row.date} ${row.time ?? ''}` : undefined)
      const actualEnd = parseDate(field(row, 'actualEnd'))

      if (!actualStart) {
        errors.push(`Fila ${index + 2}: requiere una fecha de inicio válida.`)
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
