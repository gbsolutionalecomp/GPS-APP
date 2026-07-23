import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGPS, calculateHaversineDistanceKm } from './useGPS'

describe('useGPS hook', () => {
  it('calculates Haversine distance correctly', () => {
    // Distance between CDMX (19.4326, -99.1332) and Toluca (19.2826, -99.6557) ~ 55 km
    const dist = calculateHaversineDistanceKm(19.4326, -99.1332, 19.2826, -99.6557)
    expect(dist).toBeGreaterThan(50)
    expect(dist).toBeLessThan(60)
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useGPS())
    expect(result.current.tracking).toBe(false)
    expect(result.current.currentPosition).toBeNull()
    expect(result.current.positions).toEqual([])
    expect(result.current.totalDistanceKm).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('starts tracking when startTracking is called', () => {
    const { result } = renderHook(() => useGPS())
    act(() => {
      result.current.startTracking()
    })
    expect(result.current.tracking).toBe(true)
    expect(result.current.currentPosition).not.toBeNull()
  })

  it('stops tracking when stopTracking is called', () => {
    const { result } = renderHook(() => useGPS())
    act(() => {
      result.current.startTracking()
    })
    act(() => {
      result.current.stopTracking()
    })
    expect(result.current.tracking).toBe(false)
  })
})
