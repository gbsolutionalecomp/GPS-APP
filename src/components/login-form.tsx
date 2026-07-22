'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const CONFIRM_ERROR_MESSAGE = 'Ese enlace ya no es válido o expiró. Pide uno nuevo.'

export function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const { mode, setDemoRole } = useApp()
  const [error, setError] = useState<string | undefined>(search.get('error') === 'confirm_failed' ? CONFIRM_ERROR_MESSAGE : undefined)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined)
    const data = new FormData(event.currentTarget)
    const currentEmail = String(data.get('email') ?? email).trim().toLowerCase()
    if (!currentEmail.includes('@')) {
      setError('Escribe un correo válido.')
      setBusy(false)
      return
    }
    if (step === 'email') {
      const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(search.get('next') || '/')}`
      const { error: otpError } = await getSupabaseBrowserClient().auth.signInWithOtp({
        email: currentEmail,
        options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
      })
      setBusy(false)
      if (otpError) { setError('No fue posible enviar el código. Verifica el correo.'); return }
      setEmail(currentEmail)
      setSent(true)
      setStep('code')
      return
    }
    const currentCode = String(data.get('code') ?? code).replace(/\D/g, '').slice(0, 6)
    if (!currentCode) {
      setError('Escribe el código de verificación.')
      setBusy(false)
      return
    }
    const { error: verifyError } = await getSupabaseBrowserClient().auth.verifyOtp({ email: currentEmail, token: currentCode, type: 'email' })
    if (verifyError) { setError('El código no es válido o expiró.'); setBusy(false); return }
    router.push(search.get('next') || '/'); router.refresh()
  }

  if (mode === 'demo') return <div className="stack"><div className="notice"><div><strong>Modo de demostración</strong><span>Usa datos sintéticos; no modifica Supabase ni la plataforma GPS.</span></div></div><Button onClick={() => { setDemoRole('admin'); router.push('/') }} type="button">Entrar como administrador</Button><Button onClick={() => { setDemoRole('engineer'); router.push('/mis-viajes') }} type="button" variant="secondary">Entrar como ingeniero</Button></div>

  return <form className="stack" onSubmit={submit}>
    <div className="notice">
      <div>
        <strong>Acceso por código</strong>
        <span>{step === 'email' ? 'Te enviaremos un código al correo para crear o abrir tu cuenta.' : `Ya enviamos el código a ${email}.`}</span>
      </div>
    </div>
    <label className="form-field">Correo institucional<input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email}/></label>
    {step === 'code' ? <label className="form-field">Código de verificación<input autoComplete="one-time-code" inputMode="numeric" name="code" onChange={(event) => setCode(event.target.value)} placeholder="123456" required value={code}/></label> : null}
    <Button disabled={busy} type="submit">{busy ? (step === 'email' ? 'Enviando…' : 'Verificando…') : (step === 'email' ? 'Enviar código' : 'Validar código')}</Button>
    {step === 'code' ? <Button onClick={() => { setStep('email'); setSent(false); setCode(''); setError(undefined) }} type="button" variant="secondary">Usar otro correo</Button> : null}
    {sent && step === 'code' ? <p className="form-message" role="status">Revisa tu correo y escribe el código de 6 dígitos.</p> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </form>
}
