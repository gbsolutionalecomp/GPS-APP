'use client'

import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export function ScheduleJourneyForm({ onDone }: { onDone?: () => void }) {
  const { snapshot, busy, createJourney } = useApp()
  const [message, setMessage] = useState<string>()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(undefined)
    const data = new FormData(event.currentTarget)
    try {
      await createJourney({
        vehicleId: String(data.get('vehicleId')), projectId: String(data.get('projectId')), engineerId: String(data.get('engineerId')),
        plannedStart: String(data.get('plannedStart')), plannedEnd: String(data.get('plannedEnd')), origin: String(data.get('origin')), destination: String(data.get('destination')),
      })
      event.currentTarget.reset(); setMessage('Viaje programado.'); onDone?.()
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'No fue posible programar el viaje.') }
  }
  return <form onSubmit={submit}>
    <div className="form-grid">
      <label>Vehículo<select name="vehicleId" required><option disabled selected value="">Selecciona unidad</option>{snapshot.vehicles.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.plate} · {item.name}</option>)}</select></label>
      <label>Proyecto<select name="projectId" required><option disabled selected value="">Selecciona proyecto</option>{snapshot.projects.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
      <label>Ingeniero<select name="engineerId" required><option disabled selected value="">Selecciona ingeniero</option>{snapshot.profiles.filter((item) => item.role === 'engineer' && item.active).map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
      <label>Inicio planeado<input name="plannedStart" required type="datetime-local"/></label>
      <label>Fin planeado<input name="plannedEnd" required type="datetime-local"/></label>
      <label>Origen<input name="origin" placeholder="Oficinas GBS" required/></label>
      <label className="form-grid__wide">Destino<input name="destination" placeholder="Proyecto o ubicación objetivo" required/></label>
    </div>
    <div className="form-actions"><Button disabled={busy} type="submit"><Icon name="calendar" size={15}/>Programar viaje</Button></div>
    {message ? <p className={message.includes('programado') ? 'form-message' : 'form-error'} role="status">{message}</p> : null}
  </form>
}
