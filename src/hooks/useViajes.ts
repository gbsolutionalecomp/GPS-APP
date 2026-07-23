'use client'

import { useState, useCallback } from 'react'

export interface ViajeItem {
  id: string
  vehicleId: string
  projectId?: string
  assignedToUserEmail?: string
  status: string
  actualStart?: string
  actualEnd?: string
  gpsDistanceKm?: number
}

export function useViajes(initialJourneys: ViajeItem[] = []) {
  const [journeys, setJourneys] = useState<ViajeItem[]>(initialJourneys)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const filteredJourneys = journeys.filter((j) => {
    const matchesStatus = filterStatus === 'all' || j.status === filterStatus
    const matchesSearch =
      !searchTerm ||
      j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.assignedToUserEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const assignJourney = useCallback((id: string, projectId: string, engineerEmail: string) => {
    setJourneys((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, projectId, assignedToUserEmail: engineerEmail, status: 'sin_evidencia' } : j
      )
    )
  }, [])

  return {
    journeys: filteredJourneys,
    totalCount: journeys.length,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    assignJourney,
  }
}
