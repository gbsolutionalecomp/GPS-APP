'use client'

import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { ScheduleJourneyForm } from '@/components/schedule-journey-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'
import { initials } from '@/domain/format'

type TabKey = 'vehiculos' | 'ingenieros' | 'proyectos' | 'viajes'

export default function RegistrosPage() {
  const { snapshot, busy, addProject, addVehicle, inviteEngineer } = useApp()
  const [activeTab, setActiveTab] = useState<TabKey>('vehiculos')
  const [message, setMessage] = useState<string>()

  async function projectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await addProject(String(data.get('code')), String(data.get('name')))
      event.currentTarget.reset()
      setMessage('Proyecto registrado exitosamente.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Error al registrar proyecto.')
    }
  }

  async function vehicleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await addVehicle(String(data.get('plate')), String(data.get('name')), String(data.get('deviceId')))
      event.currentTarget.reset()
      setMessage('Vehículo registrado exitosamente.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Error al registrar vehículo.')
    }
  }

  async function engineerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await inviteEngineer(String(data.get('fullName')), String(data.get('email')))
      event.currentTarget.reset()
      setMessage('Ingeniero registrado exitosamente.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Error al registrar ingeniero.')
    }
  }

  return (
    <>
      <PageHeader
        description="Centro de altas y administración: registra vehículos, ingenieros, proyectos y programa viajes."
        eyebrow="Administración"
        title="REGISTROS"
      />

      {message ? (
        <div className="notice" role="status" style={{ marginBottom: 16 }}>
          <Icon name="check" />
          <div>
            <strong>Confirmación</strong>
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'vehiculos'}
          onClick={() => { setActiveTab('vehiculos'); setMessage(undefined) }}
          type="button"
        >
          Alta de Vehículos ({snapshot.vehicles.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'ingenieros'}
          onClick={() => { setActiveTab('ingenieros'); setMessage(undefined) }}
          type="button"
        >
          Alta de Ingenieros ({snapshot.profiles.filter((p) => p.role === 'engineer').length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'proyectos'}
          onClick={() => { setActiveTab('proyectos'); setMessage(undefined) }}
          type="button"
        >
          Alta de Proyectos ({snapshot.projects.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'viajes'}
          onClick={() => { setActiveTab('viajes'); setMessage(undefined) }}
          type="button"
        >
          Programar Viaje
        </button>
      </div>

      {activeTab === 'vehiculos' && (
        <Card subtitle="Registro de unidades y flotilla" title="Dar de alta vehículo">
          <form onSubmit={vehicleSubmit}>
            <div className="form-grid">
              <label>
                Placa
                <input name="plate" placeholder="ABC-123-A" required />
              </label>
              <label>
                Nombre / Descripción
                <input name="name" placeholder="Unidad GBS-01" required />
              </label>
              <label className="form-grid__wide">
                ID de la plataforma GPS (opcional)
                <input name="deviceId" placeholder="Identificador de dispositivo GPS" />
              </label>
            </div>
            <div className="form-actions">
              <Button disabled={busy} type="submit">
                Registrar vehículo
              </Button>
            </div>
          </form>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 13, marginBottom: 12, fontWeight: 700 }}>Vehículos registrados</h3>
            {snapshot.vehicles.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No hay vehículos registrados aún.</p>
            ) : (
              <div className="catalog-list">
                {snapshot.vehicles.map((vehicle) => (
                  <div className="catalog-item" key={vehicle.id}>
                    <span className="trip-card__icon">
                      <Icon name="car" />
                    </span>
                    <div>
                      <strong>{vehicle.plate} · {vehicle.name}</strong>
                      <small>{vehicle.locateliaDeviceId ?? 'Sin ID de plataforma GPS'}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'ingenieros' && (
        <Card subtitle="Personal técnico de campo" title="Dar de alta ingeniero">
          <form onSubmit={engineerSubmit}>
            <div className="form-grid">
              <label>
                Nombre completo
                <input name="fullName" placeholder="Nombre completo" required />
              </label>
              <label>
                Correo electrónico
                <input name="email" placeholder="correo@gbs.com" required type="email" />
              </label>
            </div>
            <div className="form-actions">
              <Button disabled={busy} type="submit">
                Registrar ingeniero
              </Button>
            </div>
          </form>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 13, marginBottom: 12, fontWeight: 700 }}>Ingenieros registrados</h3>
            {snapshot.profiles.filter((p) => p.role === 'engineer').length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No hay ingenieros registrados aún.</p>
            ) : (
              <div className="catalog-list">
                {snapshot.profiles
                  .filter((profile) => profile.role === 'engineer')
                  .map((profile) => (
                    <div className="catalog-item" key={profile.id}>
                      <span className="avatar">{initials(profile.fullName)}</span>
                      <div>
                        <strong>{profile.fullName}</strong>
                        <small>{profile.email}</small>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'proyectos' && (
        <Card subtitle="Catálogo de proyectos y obras" title="Dar de alta proyecto">
          <form onSubmit={projectSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '140px 1fr' }}>
              <label>
                Código
                <input name="code" placeholder="PRY-001" required />
              </label>
              <label>
                Nombre del proyecto
                <input name="name" placeholder="Nombre de proyecto u obra" required />
              </label>
            </div>
            <div className="form-actions">
              <Button disabled={busy} type="submit">
                Registrar proyecto
              </Button>
            </div>
          </form>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 13, marginBottom: 12, fontWeight: 700 }}>Proyectos registrados</h3>
            {snapshot.projects.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No hay proyectos registrados aún.</p>
            ) : (
              <div className="catalog-list">
                {snapshot.projects.map((project) => (
                  <div className="catalog-item" key={project.id}>
                    <span className="avatar">{project.code.slice(-2)}</span>
                    <div>
                      <strong>{project.code}</strong>
                      <small>{project.name}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'viajes' && (
        <Card subtitle="Programación de recorridos planificados" title="Dar de alta / Programar viaje">
          <ScheduleJourneyForm />
        </Card>
      )}
    </>
  )
}
