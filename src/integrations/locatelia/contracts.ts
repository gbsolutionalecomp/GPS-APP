import type { Journey, JourneyStop, Vehicle } from '@/domain/types'

export interface LocateliaDirectory {
  vehicles: readonly Vehicle[]
}

export interface NormalizedLocateliaBatch {
  journeys: Journey[]
  stops: JourneyStop[]
  warnings: string[]
  errors: string[]
}

export interface LocateliaAdapter {
  normalize(records: readonly Record<string, unknown>[], directory: LocateliaDirectory): Promise<NormalizedLocateliaBatch>
}
