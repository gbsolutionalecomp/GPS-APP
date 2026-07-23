import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViajes, ViajeItem } from './useViajes'

describe('useViajes hook', () => {
  const initial: ViajeItem[] = [
    { id: 'v-1', vehicleId: 'UNIDAD-01', projectId: 'p-1', status: 'sin_evidencia', assignedToUserEmail: 'ing@gbs.com' },
    { id: 'v-2', vehicleId: 'UNIDAD-02', projectId: 'p-2', status: 'completado', assignedToUserEmail: 'admin@gbs.com' },
  ]

  it('filters journeys by status', () => {
    const { result } = renderHook(() => useViajes(initial))
    expect(result.current.journeys).toHaveLength(2)

    act(() => {
      result.current.setFilterStatus('completado')
    })
    expect(result.current.journeys).toHaveLength(1)
    expect(result.current.journeys[0]?.id).toBe('v-2')
  })

  it('filters journeys by search term', () => {
    const { result } = renderHook(() => useViajes(initial))

    act(() => {
      result.current.setSearchTerm('UNIDAD-01')
    })
    expect(result.current.journeys).toHaveLength(1)
    expect(result.current.journeys[0]?.vehicleId).toBe('UNIDAD-01')
  })

  it('assigns journey to project and engineer', () => {
    const { result } = renderHook(() => useViajes(initial))

    act(() => {
      result.current.assignJourney('v-1', 'p-99', 'nuevo@gbs.com')
    })

    const updated = result.current.journeys.find((j) => j.id === 'v-1')
    expect(updated?.projectId).toBe('p-99')
    expect(updated?.assignedToUserEmail).toBe('nuevo@gbs.com')
  })
})
