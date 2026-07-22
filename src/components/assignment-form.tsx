'use client'

import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import type { Journey } from '@/domain/types'

export function AssignmentForm({ journey }: { journey: Journey }) {
  const { snapshot, busy, assignJourney } = useApp()
  const [message, setMessage] = useState<string>()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(undefined)
    const data = new FormData(event.currentTarget)
    try { await assignJourney(journey.id, String(data.get('projectId')), String(data.get('engineerId'))); setMessage('Asignación actualizada.') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'No fue posible asignar el viaje.') }
  }
  return <form onSubmit={submit}><div className="form-grid"><label>Proyecto<select defaultValue={journey.projectId ?? ''} name="projectId" required><option disabled value="">Selecciona proyecto</option>{snapshot.projects.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label>Ingeniero<select defaultValue={journey.engineerId ?? ''} name="engineerId" required><option disabled value="">Selecciona ingeniero</option>{snapshot.profiles.filter((item) => item.role === 'engineer' && item.active).map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label></div><div className="form-actions"><Button disabled={busy} type="submit">Guardar asignación</Button></div>{message ? <p className={message.includes('actualizada') ? 'form-message' : 'form-error'}>{message}</p> : null}</form>
}
