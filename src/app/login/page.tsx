import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return <main className="auth-page"><section className="auth-card"><header className="auth-card__brand"><span className="sidebar__mark">GB</span><div><strong>Control de viajes</strong><span>GPS · Proyectos</span></div></header><div className="auth-card__body"><h1>Acceso operativo</h1><p>Ingresa para consultar recorridos, asignaciones y evidencias de odómetro.</p><Suspense fallback={<div className="skeleton" style={{ height: 160 }}/> }><LoginForm/></Suspense></div><footer>Información privada de GBSolution · Acceso con trazabilidad</footer></section></main>
}
