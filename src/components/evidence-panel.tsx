'use client'

import Image from 'next/image'
import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { evidenceForJourney } from '@/domain/journeys'
import { formatDateTime } from '@/domain/format'
import type { EvidenceKind, Journey, OdometerEvidence } from '@/domain/types'
import { compressImage } from '@/lib/media/compress-image'

function EvidenceSlot({ journey, evidence, kind, disabled }: { journey: Journey; evidence?: OdometerEvidence; kind: EvidenceKind; disabled: boolean }) {
  const { busy, saveEvidence } = useApp()
  const [message, setMessage] = useState<string>()
  const [compressing, setCompressing] = useState(false)
  const label = kind === 'before' ? 'Odómetro inicial' : 'Odómetro final'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(undefined)
    const data = new FormData(event.currentTarget)
    const readingKm = Number(data.get('readingKm'))
    const file = data.get('photo')
    if (!(file instanceof File) || !file.size) { setMessage('Selecciona una fotografía.'); return }
    try {
      setCompressing(true)
      const optimized = await compressImage(file)
      setCompressing(false)
      await saveEvidence({ journeyId: journey.id, kind, readingKm, file: optimized })
      setMessage('Foto guardada correctamente.'); event.currentTarget.reset()
    } catch (cause) { setCompressing(false); setMessage(cause instanceof Error ? cause.message : 'No fue posible guardar la foto.') }
  }

  return <article className="evidence-card">
    <div className="evidence-photo">{evidence ? <Image alt={`${label} del viaje`} fill priority={false} sizes="(max-width: 820px) 100vw, 40vw" src={evidence.photoUrl} unoptimized/> : <div className="evidence-empty"><Icon name="camera" size={30}/><span>Fotografía pendiente</span></div>}</div>
    <div className="evidence-card__body"><header><h3>{label}</h3><Badge tone={evidence ? 'success' : 'warning'}>{evidence ? 'Registrado' : 'Pendiente'}</Badge></header>{evidence ? <><p className="evidence-reading">{evidence.readingKm.toLocaleString('es-MX')} km</p><p className="evidence-meta">Cargada {formatDateTime(evidence.uploadedAt)}</p></> : null}
      <form className="evidence-form" onSubmit={submit}><label className="form-field">Lectura en kilómetros<input defaultValue={evidence?.readingKm} disabled={disabled || busy || compressing} min="0" name="readingKm" required step="0.1" type="number"/></label><label className="form-field">Fotografía JPG, PNG o WebP<input accept="image/jpeg,image/png,image/webp" capture="environment" className="file-input" disabled={disabled || busy || compressing} name="photo" required type="file"/></label><Button disabled={disabled || busy || compressing} type="submit" variant="secondary"><Icon name="upload" size={15}/>{compressing ? 'Optimizando foto…' : evidence ? 'Reemplazar foto' : 'Guardar foto'}</Button>{disabled ? <small className="form-error">La foto final se habilita cuando el recorrido termina.</small> : null}{message ? <small className={message.includes('correctamente') ? 'form-message' : 'form-error'} role="status">{message}</small> : null}</form>
    </div>
  </article>
}

export function EvidencePanel({ journey }: { journey: Journey }) {
  const { snapshot } = useApp()
  const pair = evidenceForJourney(snapshot.evidence, journey.id)
  return <div className="evidence-grid"><EvidenceSlot disabled={false} evidence={pair.before} journey={journey} kind="before"/><EvidenceSlot disabled={!journey.actualEnd} evidence={pair.after} journey={journey} kind="after"/></div>
}
