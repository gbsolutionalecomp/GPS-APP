import { describe, expect, it } from 'vitest'
import { demoSnapshot } from '@/data/demo'
import { DefaultLocateliaAdapter } from './adapter'

describe('adaptador Locatelia', () => {
  it('normaliza una exportación y construye una huella si no existe identificador', async () => {
    const result = await new DefaultLocateliaAdapter().normalize([{
      Placa: 'RTP-482-A', Inicio: '18/07/2026 08:06', Fin: '18/07/2026 14:31', Kilómetros: '86.4',
      Origen: 'GBS', Destino: 'Centro', Paradas: 'Torre|18/07/2026 09:00|18/07/2026 09:20',
    }], { vehicles: demoSnapshot.vehicles })
    expect(result.errors).toHaveLength(0)
    expect(result.journeys[0]?.fingerprint).toMatch(/^[a-f0-9]{64}$/)
    expect(result.stops[0]).toMatchObject({ location: 'Torre', durationMinutes: 20 })
  })

  it('da de alta automáticamente una unidad que no pertenece al catálogo', async () => {
    const vehicles = [{ id: 'v1', plate: 'RTP-482-A', name: 'NP300', active: true }]
    const result = await new DefaultLocateliaAdapter().normalize([{ Placa: 'ZZZ-999', Inicio: '18/07/2026 08:06' }], { vehicles })
    expect(result.journeys).toHaveLength(1)
    expect(result.warnings.some((w) => w.includes('ZZZ-999'))).toBe(true)
  })
})
