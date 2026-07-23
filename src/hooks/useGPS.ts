'use client'

import { useState, useCallback } from 'react'

export interface Position {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number | null
  timestamp: number
}

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

export function useGPS() {
  const [tracking, setTracking] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [error, setError] = useState<string | null>(null)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador')
      return
    }

    setTracking(true)
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        }
        setCurrentPosition(newPos)
        setPositions((prev) => [...prev, newPos])
      },
      (err) => {
        setError(err.message)
        setTracking(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )

    return watchId
  }, [])

  const stopTracking = useCallback(() => {
    setTracking(false)
  }, [])

  const totalDistanceKm = positions.reduce((acc, pos, idx) => {
    if (idx === 0) return 0
    const prev = positions[idx - 1]
    if (!prev) return acc
    return acc + calculateHaversineDistanceKm(prev.latitude, prev.longitude, pos.latitude, pos.longitude)
  }, 0)

  return {
    tracking,
    currentPosition,
    positions,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    error,
    startTracking,
    stopTracking,
  }
}
