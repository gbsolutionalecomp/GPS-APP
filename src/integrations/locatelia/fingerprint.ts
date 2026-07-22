import { createHash } from 'node:crypto'

export function journeyFingerprint(input: { vehicleId: string; actualStart: string; actualEnd?: string; gpsDistanceKm?: number }): string {
  const canonical = [input.vehicleId, input.actualStart, input.actualEnd ?? '', input.gpsDistanceKm?.toFixed(3) ?? ''].join('|')
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}
