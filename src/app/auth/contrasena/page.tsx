import { Suspense } from 'react'
import { SetPasswordForm } from '@/components/set-password-form'

export default function SetPasswordPage() {
  return <main className="auth-page"><section className="auth-card"><header className="auth-card__brand"><span className="sidebar__mark">GB</span><div><strong>Control de viajes</strong><span>GPS · Proyectos</span></div></header><div className="auth-card__body"><h1>Crea tu contraseña</h1><p>Define una contraseña para entrar a tu cuenta.</p><Suspense fallback={<div className="skeleton" style={{ height: 160 }}/> }><SetPasswordForm/></Suspense></div><footer>Información privada de GBSolution · Acceso con trazabilidad</footer></section></main>
}
