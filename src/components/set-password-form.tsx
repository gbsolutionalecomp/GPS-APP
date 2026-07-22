'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function SetPasswordForm() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const { data } = await getSupabaseBrowserClient().auth.getUser()
        if (!active) return
        setSessionReady(Boolean(data.user))
      } catch {
        if (active) setSessionReady(false)
      } finally {
        if (active) setChecking(false)
      }
    }
    void check()
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(undefined)
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password'))
    const confirmation = String(data.get('confirmation'))
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); setBusy(false); return }
    try {
      const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password })
      if (updateError) { setError('No fue posible guardar la contraseña. Intenta de nuevo.'); setBusy(false); return }
      router.push('/'); router.refresh()
    } catch {
      setError('No fue posible guardar la contraseña. Intenta de nuevo.'); setBusy(false)
    }
  }

  if (checking) return <div className="skeleton" style={{ height: 160 }}/>

  if (!sessionReady) return <div className="stack"><p className="form-error" role="alert">Este enlace ya no es válido o expiró. Pide uno nuevo desde el inicio de sesión.</p><Button onClick={() => router.push('/login')} type="button" variant="secondary">Volver al inicio de sesión</Button></div>

  return <form className="stack" onSubmit={submit}>
    <label className="form-field">Nueva contraseña<input autoComplete="new-password" minLength={8} name="password" required type="password"/></label>
    <label className="form-field">Confirma la contraseña<input autoComplete="new-password" minLength={8} name="confirmation" required type="password"/></label>
    <Button disabled={busy} type="submit">{busy ? 'Guardando…' : 'Guardar y entrar'}</Button>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </form>
}
