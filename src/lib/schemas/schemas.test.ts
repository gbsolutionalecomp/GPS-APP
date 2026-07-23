import { describe, it, expect } from 'vitest'
import {
  ScheduleViajeSchema,
  GPSTelemetryPointSchema,
  ParadaSchema,
  EvidenciaOdometroSchema,
  LoginSchema,
  SetPasswordSchema,
} from './index'

describe('Zod Schemas', () => {
  it('validates ScheduleViajeSchema', () => {
    const valid = ScheduleViajeSchema.safeParse({
      vehiculo_id: 'v-1',
      proyecto_id: 'p-1',
      ingeniero_id: 'ing-1',
      origen: 'CDMX',
      destino: 'Querétaro',
      fecha_programada: '2026-07-25',
    })
    expect(valid.success).toBe(true)

    const invalid = ScheduleViajeSchema.safeParse({ vehiculo_id: '' })
    expect(invalid.success).toBe(false)
  })

  it('validates GPSTelemetryPointSchema', () => {
    const valid = GPSTelemetryPointSchema.safeParse({
      vehiculo_id: 'v-1',
      latitud: 19.4326,
      longitud: -99.1332,
      velocidad_kmh: 80,
      timestamp: '2026-07-23T12:00:00.000Z',
    })
    expect(valid.success).toBe(true)

    const invalidLat = GPSTelemetryPointSchema.safeParse({
      vehiculo_id: 'v-1',
      latitud: 120, // out of bounds
      longitud: -99.1332,
      velocidad_kmh: 80,
      timestamp: '2026-07-23T12:00:00.000Z',
    })
    expect(invalidLat.success).toBe(false)
  })

  it('validates ParadaSchema', () => {
    const valid = ParadaSchema.safeParse({
      viaje_id: 'v-1',
      inicio: '2026-07-23T10:00:00.000Z',
      fin: '2026-07-23T10:15:00.000Z',
      duracion_minutos: 15,
      latitud: 19.4326,
      longitud: -99.1332,
    })
    expect(valid.success).toBe(true)
  })

  it('validates EvidenciaOdometroSchema refinement', () => {
    const valid = EvidenciaOdometroSchema.safeParse({
      viaje_id: 'v-1',
      odometro_inicial_km: 100,
      odometro_final_km: 150,
      foto_inicial_url: 'https://example.com/ini.jpg',
      foto_final_url: 'https://example.com/fin.jpg',
    })
    expect(valid.success).toBe(true)

    const invalidRefine = EvidenciaOdometroSchema.safeParse({
      viaje_id: 'v-1',
      odometro_inicial_km: 200,
      odometro_final_km: 150, // lower than initial
      foto_inicial_url: 'https://example.com/ini.jpg',
      foto_final_url: 'https://example.com/fin.jpg',
    })
    expect(invalidRefine.success).toBe(false)
  })

  it('validates LoginSchema and SetPasswordSchema', () => {
    expect(LoginSchema.safeParse({ email: 'user@gbs.com', password: 'password123' }).success).toBe(true)
    expect(LoginSchema.safeParse({ email: 'invalid-email', password: '123' }).success).toBe(false)

    expect(SetPasswordSchema.safeParse({ password: 'secret1234', confirmPassword: 'secret1234' }).success).toBe(true)
    expect(SetPasswordSchema.safeParse({ password: 'secret1234', confirmPassword: 'different' }).success).toBe(false)
  })
})
