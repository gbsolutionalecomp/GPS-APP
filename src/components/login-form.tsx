'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { useApp } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const CONFIRM_ERROR_MESSAGE = 'Ese enlace ya no es válido o expiró. Pide uno nuevo.'

function RecoverForm({ onBack }: { onBack: () => void }) {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined)
    const email = String(new FormData(event.currentTarget).get('email'))
    const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/auth/contrasena')}`
    const { error: recoverError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo })
    setBusy(false)
    if (recoverError) { setError('No fue posible enviar el correo. Verifica la dirección.'); return }
    setSent(true)
  }
  if (sent) return <div className="stack"><p className="form-message" role="status">Si el correo existe, te enviamos un enlace para crear una contraseña nueva.</p><Button onClick={onBack} type="button" variant="secondary">Volver al inicio de sesión</Button></div>
  return <form className="stack" onSubmit={submit}>
    <label className="form-field">Correo institucional<input autoComplete="email" name="email" required type="email"/></label>
    <Button disabled={busy} type="submit">{busy ? 'Enviando…' : 'Enviar enlace'}</Button>
    <Button onClick={onBack} type="button" variant="secondary">Volver</Button>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </form>
}

export function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const { mode, setDemoRole } = useApp()
  const [error, setError] = useState<string | undefined>(search.get('error') === 'confirm_failed' ? CONFIRM_ERROR_MESSAGE : undefined)
  const [busy, setBusy] = useState(false)
  const [recovering, setRecovering] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined)
    const data = new FormData(event.currentTarget)
    const { error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword({ email: String(data.get('email')), password: String(data.get('password')) })
    if (authError) { setError('Correo o contraseña incorrectos.'); setBusy(false); return }
    router.push(search.get('next') || '/'); router.refresh()
  }

  if (mode === 'demo') return <div className="stack"><div className="notice"><div><strong>Modo de demostración</strong><span>Usa datos sintéticos; no modifica Supabase ni la plataforma GPS.</span></div></div><Button onClick={() => { setDemoRole('admin'); router.push('/') }} type="button">Entrar como administrador</Button><Button onClick={() => { setDemoRole('engineer'); router.push('/mis-viajes') }} type="button" variant="secondary">Entrar como ingeniero</Button></div>

  if (recovering) return <RecoverForm onBack={() => setRecovering(false)}/>

  return <form className="stack" onSubmit={submit}>
    <label className="form-field">Correo institucional<input autoComplete="email" name="email" required type="email"/></label>
    <label className="form-field">Contraseña<input autoComplete="current-password" minLength={8} name="password" required type="password"/></label>
    <Button disabled={busy} type="submit">{busy ? 'Verificando…' : 'Iniciar sesión'}</Button>
    <button className="link-button" onClick={() => setRecovering(true)} type="button">¿Olvidaste tu contraseña?</button>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </form>
}
