'use client'

import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { Journey, JourneyStop } from '@/domain/types'

interface ImportResult {
  fileName: string
  acceptedRows: number
  rejectedRows: number
  warnings: string[]
  errors: string[]
  journeys: Journey[]
  stops: JourneyStop[]
  committed: boolean
}

export function ImportCenter() {
  const { addImportedJourneys } = useApp()
  const [result, setResult] = useState<ImportResult>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined); setResult(undefined)
    try {
      const body = new FormData(event.currentTarget)
      const response = await fetch('/api/importaciones/locatelia', { method: 'POST', body })
      const data = await response.json() as ImportResult & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'No fue posible importar el archivo.')
      setResult(data); addImportedJourneys(data.journeys, data.stops)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Error de importación.') }
    finally { setBusy(false) }
  }
  return <><form className="upload-zone" onSubmit={submit}><Icon name="upload" size={24}/><input accept=".csv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Archivo de la plataforma GPS" name="file" required type="file"/><Button disabled={busy} type="submit">{busy ? 'Procesando…' : 'Analizar e importar'}</Button></form><p className="evidence-meta">Máximo 10 MB y 2,000 filas. Se deduplica por ID externo o huella del recorrido.</p>{error ? <p className="form-error" role="alert">{error}</p> : null}{result ? <div className="import-preview"><div className="summary-grid"><div className="summary-box"><span>Aceptados</span><strong>{result.acceptedRows}</strong></div><div className="summary-box"><span>Rechazados</span><strong>{result.rejectedRows}</strong></div><div className="summary-box"><span>Resultado</span><strong>{result.committed ? 'Guardado' : 'Demo local'}</strong></div></div>{result.warnings.map((warning) => <p className="form-message" key={warning}>{warning}</p>)}{result.errors.map((item) => <p className="form-error" key={item}>{item}</p>)}</div> : null}</>
}
