'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useApp } from '@/components/app-provider'
import { Icon, type IconName } from '@/components/ui/icon'
import type { UserRole } from '@/domain/types'
import { formatDateTime, initials } from '@/domain/format'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface NavigationItem {
  href: string
  label: string
  icon: IconName
  roles: readonly UserRole[]
}

const navigation: NavigationItem[] = [
  { href: '/', label: 'Panel operativo', icon: 'dashboard', roles: ['admin'] },
  { href: '/viajes', label: 'Viajes', icon: 'trip', roles: ['admin'] },
  { href: '/mis-viajes', label: 'Mis viajes', icon: 'car', roles: ['engineer'] },
  { href: '/reportes', label: 'Reporte mensual', icon: 'report', roles: ['admin'] },
  { href: '/catalogos', label: 'Equipo y unidades', icon: 'catalog', roles: ['admin'] },
  { href: '/integracion', label: 'Subir recorridos', icon: 'sync', roles: ['admin'] },
]

function activePath(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { mode, snapshot, error, setDemoRole } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth/')
  if (isAuthPage) return children

  const user = snapshot.currentUser
  const visibleNavigation = navigation.filter((item) => item.roles.includes(user.role))
  const lastSync = snapshot.integration.lastSuccessfulAt

  async function logout() {
    if (mode === 'supabase') await getSupabaseBrowserClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <div className="app-frame">
    <button aria-label="Abrir navegación" className="mobile-menu" onClick={() => setMenuOpen(true)} type="button"><Icon name="menu"/></button>
    {menuOpen ? <button aria-label="Cerrar navegación" className="sidebar-backdrop" onClick={() => setMenuOpen(false)} type="button"/> : null}
    <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar__brand">
        <span className="sidebar__mark">GB</span>
        <div><strong>Control de viajes</strong><small>GPS · Proyectos</small></div>
        <button aria-label="Cerrar navegación" className="sidebar__close" onClick={() => setMenuOpen(false)} type="button"><Icon name="close"/></button>
      </div>
      <div className="sidebar__context"><span>Operación activa</span><strong>GBSolution</strong><small>{snapshot.vehicles.filter((item) => item.active).length} unidades registradas</small></div>
      <nav aria-label="Navegación principal" className="sidebar__nav">
        <span className="sidebar__label">Operación</span>
        {visibleNavigation.map((item) => <Link aria-current={activePath(pathname, item.href) ? 'page' : undefined} className="sidebar__link" href={item.href} key={item.href} onClick={() => setMenuOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></Link>)}
      </nav>
      <div className="sidebar__sync"><span className={`sync-dot sync-dot--${snapshot.integration.mode === 'disabled' ? 'off' : 'on'}`}/><div><strong>{snapshot.integration.mode === 'disabled' ? 'Plataforma GPS sin conectar' : 'Sincronización automática activa'}</strong><small>{lastSync ? formatDateTime(lastSync) : 'Sube los recorridos manualmente'}</small></div></div>
      <div className="sidebar__user"><span className="avatar">{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><small>{user.role === 'admin' ? 'Administrador' : 'Ingeniero'}</small></div><button aria-label="Cerrar sesión" onClick={() => void logout()} title="Cerrar sesión" type="button"><Icon name="logout"/></button></div>
    </aside>
    <main className="workspace">
      <header className="topbar">
        <div><span className="environment-pill">{mode === 'demo' ? 'Demostración segura' : 'Supabase protegido'}</span><span className="topbar__copy">Viajes, paradas y evidencia de odómetro</span></div>
        {mode === 'demo' ? <label className="demo-role"><span>Vista demo</span><select aria-label="Cambiar rol de demostración" onChange={(event) => { setDemoRole(event.target.value as UserRole); router.push(event.target.value === 'engineer' ? '/mis-viajes' : '/') }} value={user.role}><option value="admin">Administrador</option><option value="engineer">Ingeniero</option></select></label> : <span className="topbar__role">{user.role === 'admin' ? 'Administración' : 'Operación en campo'}</span>}
      </header>
      <div className="workspace__content" id="main-content" tabIndex={-1}>
        {error ? <div className="global-error" role="alert"><Icon name="warning"/><span>{error}</span></div> : null}
        {children}
      </div>
    </main>
  </div>
}
