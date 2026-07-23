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
  const [method, setMethod] = useState<'demo' | 'password' | 'code'>('demo')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [otpFailed, setOtpFailed] = useState(false)

  function enterDemo(role: 'admin' | 'engineer') {
    setDemoRole(role)
    router.push(role === 'engineer' ? '/mis-viajes' : '/')
    router.refresh()
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    const currentEmail = email.trim().toLowerCase()
    if (!currentEmail.includes('@')) {
      setError('Escribe un correo válido.')
      setBusy(false)
      return
    }
    const { error: loginError } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: currentEmail,
      password,
    })
    setBusy(false)
    if (loginError) {
      setError('Correo o contraseña incorrectos. Revisa tus datos o usa el acceso directo.')
      return
    }
    router.push(search.get('next') || '/')
    router.refresh()
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    setOtpFailed(false)
    const currentEmail = email.trim().toLowerCase()
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
      if (otpError) {
        setOtpFailed(true)
        setError('El proveedor de correo no envió el código (servidor SMTP no activo o límite alcanzado). Puedes usar el acceso directo.')
        return
      }
      setEmail(currentEmail)
      setSent(true)
      setStep('code')
      return
    }
    const currentCode = code.replace(/\D/g, '').slice(0, 6)
    if (!currentCode) {
      setError('Escribe el código de verificación de 6 dígitos.')
      setBusy(false)
      return
    }
    const { error: verifyError } = await getSupabaseBrowserClient().auth.verifyOtp({ email: currentEmail, token: currentCode, type: 'email' })
    setBusy(false)
    if (verifyError) {
      setError('El código no es válido o expiró.')
      return
    }
    router.push(search.get('next') || '/')
    router.refresh()
  }

  if (mode === 'demo') {
    return (
      <div className="stack">
        <div className="notice">
          <div>
            <strong>Acceso Directo</strong>
            <span>Selecciona un perfil para ingresar inmediatamente a la plataforma.</span>
          </div>
        </div>
        <Button onClick={() => enterDemo('admin')} type="button" variant="primary">
          Entrar como Administrador
        </Button>
        <Button onClick={() => enterDemo('engineer')} type="button" variant="secondary">
          Entrar como Ingeniero
        </Button>
      </div>
    )
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.25rem' }}>
        <Button
          type="button"
          variant={method === 'demo' ? 'primary' : 'secondary'}
          onClick={() => { setMethod('demo'); setError(undefined) }}
          style={{ flex: 1, fontSize: '11px' }}
        >
          Acceso Directo
        </Button>
        <Button
          type="button"
          variant={method === 'password' ? 'primary' : 'secondary'}
          onClick={() => { setMethod('password'); setError(undefined) }}
          style={{ flex: 1, fontSize: '11px' }}
        >
          Contraseña
        </Button>
        <Button
          type="button"
          variant={method === 'code' ? 'primary' : 'secondary'}
          onClick={() => { setMethod('code'); setError(undefined) }}
          style={{ flex: 1, fontSize: '11px' }}
        >
          Código OTP
        </Button>
      </div>

      {method === 'demo' ? (
        <div className="stack">
          <div className="notice">
            <div>
              <strong>Acceso Rápido</strong>
              <span>Ingresa directamente a la vista operativa sin esperar correos.</span>
            </div>
          </div>
          <Button onClick={() => enterDemo('admin')} type="button" variant="primary">
            Ingresar como Administrador
          </Button>
          <Button onClick={() => enterDemo('engineer')} type="button" variant="secondary">
            Ingresar como Ingeniero
          </Button>
        </div>
      ) : method === 'password' ? (
        <form className="stack" onSubmit={handlePasswordSubmit}>
          <div className="notice">
            <div>
              <strong>Inicio de sesión con contraseña</strong>
              <span>Ingresa con tu correo institucional y tu contraseña.</span>
            </div>
          </div>
          <label className="form-field">
            Correo institucional
            <input autoComplete="email" name="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
          </label>
          <label className="form-field">
            Contraseña
            <input autoComplete="current-password" name="password" onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
          </label>
          <Button disabled={busy} type="submit">{busy ? 'Ingresando…' : 'Iniciar sesión'}</Button>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </form>
      ) : (
        <form className="stack" onSubmit={handleOtpSubmit}>
          <div className="notice">
            <div>
              <strong>Acceso por código por correo</strong>
              <span>{step === 'email' ? 'Escribe tu correo para solicitar tu código de 6 dígitos.' : `Código enviado a ${email}.`}</span>
            </div>
          </div>
          <label className="form-field">
            Correo institucional
            <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email}/>
          </label>
          {step === 'code' ? (
            <label className="form-field">
              Código de verificación
              <input autoComplete="one-time-code" inputMode="numeric" name="code" onChange={(event) => setCode(event.target.value)} placeholder="123456" required value={code}/>
            </label>
          ) : null}
          <Button disabled={busy} type="submit">{busy ? (step === 'email' ? 'Enviando…' : 'Verificando…') : (step === 'email' ? 'Enviar código por correo' : 'Validar código')}</Button>
          {step === 'code' ? (
            <Button onClick={() => { setStep('email'); setSent(false); setCode(''); setError(undefined) }} type="button" variant="secondary">Usar otro correo</Button>
          ) : null}
          {sent && step === 'code' ? (
            <p className="form-message" role="status">Revisa tu bandeja de entrada o SPAM para ingresar el código.</p>
          ) : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {otpFailed ? (
            <div className="stack" style={{ marginTop: '0.5rem' }}>
              <Button onClick={() => enterDemo('admin')} type="button" variant="secondary">
                Entrar directo como Administrador
              </Button>
              <Button onClick={() => enterDemo('engineer')} type="button" variant="quiet">
                Entrar directo como Ingeniero
              </Button>
            </div>
          ) : null}
        </form>
      )}
    </div>
  )
}


