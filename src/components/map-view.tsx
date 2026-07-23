'use client'

import React from 'react'

export interface MapPoint {
  lat: number
  lng: number
  label?: string
  timestamp?: string
  speedKmh?: number
}

export interface MapViewProps {
  origin?: string
  destination?: string
  points?: MapPoint[]
  stops?: { id: string; location: string; durationMinutes: number }[]
  className?: string
}

export function MapView({ origin, destination, points = [], stops = [], className = '' }: MapViewProps) {
  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-lg ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="font-semibold text-lg text-emerald-400">Visualización de Ruta GPS</h3>
          <p className="text-xs text-slate-400">
            {origin || 'Origen N/A'} → {destination || 'Destino N/A'}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
          {points.length} Puntos GPS | {stops.length} Paradas
        </span>
      </div>

      <div className="relative flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-emerald-400">
            📍
          </div>
          <p className="text-sm font-medium text-slate-300">Mapa Interactivo de Recorrido</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="rounded bg-slate-800 px-2 py-1">📍 Origen: {origin || 'Inicio'}</span>
            <span className="rounded bg-slate-800 px-2 py-1">🏁 Destino: {destination || 'Fin'}</span>
          </div>
        </div>
      </div>

      {stops.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Paradas Registradas</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {stops.map((stop) => (
              <div key={stop.id} className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2 text-xs border border-slate-700/50">
                <span className="truncate text-slate-300 font-medium">{stop.location}</span>
                <span className="ml-2 font-medium text-amber-400">{stop.durationMinutes} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
