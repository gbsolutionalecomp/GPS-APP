import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapView } from './map-view'

describe('MapView component', () => {
  it('renders route headers and origin/destination', () => {
    render(<MapView origin="Ciudad de México" destination="Toluca" />)
    expect(screen.getByText('Visualización de Ruta GPS')).toBeInTheDocument()
    expect(screen.getByText('Ciudad de México → Toluca')).toBeInTheDocument()
  })

  it('renders stops list when provided', () => {
    const stops = [{ id: 's-1', location: 'Caseta Tepotzotlán', durationMinutes: 15 }]
    render(<MapView stops={stops} />)
    expect(screen.getByText('Caseta Tepotzotlán')).toBeInTheDocument()
    expect(screen.getByText('15 min')).toBeInTheDocument()
  })
})
