'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { PageHeader } from '@/components/ui/page-header'

export default function SettingsPage() {
  const [theme, setTheme] = useState<'standard' | 'inverted'>(() => {
    if (typeof window === 'undefined') return 'standard'
    return (window.localStorage.getItem('gbs_theme') as 'standard' | 'inverted') || 'standard'
  })
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    if (typeof window === 'undefined') return 'md'
    return (window.localStorage.getItem('gbs_font_size') as 'sm' | 'md' | 'lg' | 'xl') || 'md'
  })
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '/logo.png'
    return window.localStorage.getItem('gbs_logo_url') || '/logo.png'
  })
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  function notifyChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('gbs-settings-changed'))
    }
  }

  function handleThemeChange(newTheme: 'standard' | 'inverted') {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gbs_theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
      notifyChange()
    }
    showToast('Modo de color actualizado correctamente.')
  }

  function handleFontSizeChange(newSize: 'sm' | 'md' | 'lg' | 'xl') {
    setFontSize(newSize)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gbs_font_size', newSize)
      document.documentElement.setAttribute('data-font-size', newSize)
      notifyChange()
    }
    showToast('Tamaño de letra actualizado correctamente.')
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result ?? '')
      if (dataUrl) {
        setLogoUrl(dataUrl)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('gbs_logo_url', dataUrl)
          notifyChange()
        }
        showToast('Logotipo institucional actualizado.')
      }
    }
    reader.readAsDataURL(file)
  }

  function resetLogo() {
    const defaultLogo = '/logo.png'
    setLogoUrl(defaultLogo)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gbs_logo_url', defaultLogo)
      notifyChange()
    }
    showToast('Logotipo restablecido al valor original.')
  }

  function showToast(msg: string) {
    setSavedMessage(msg)
    setTimeout(() => setSavedMessage(null), 3000)
  }

  return (
    <>
      <PageHeader
        description="Personaliza la apariencia del sistema, cambia a colores invertidos, ajusta la escala de tipografía y administra el logotipo de la empresa."
        eyebrow="Ajustes de Sistema"
        title="Configuraciones"
      />

      {savedMessage ? (
        <div className="notice" style={{ marginBottom: '16px', background: 'var(--surface-subtle)', borderColor: 'var(--border-strong)' }}>
          <Icon name="check" size={16} />
          <span>{savedMessage}</span>
        </div>
      ) : null}

      <div className="stack" style={{ gap: '20px' }}>
        {/* SECCIÓN 1: LOGOTIPO INSTITUCIONAL */}
        <Card subtitle="Visualiza y administra el logotipo oficial que se muestra en el menú lateral y documentos" title="1. Logotipo de la Empresa">
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'center' }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px dashed var(--border-strong)',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '140px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logotipo de la empresa"
                style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
              <span style={{ fontSize: '11px', color: '#71717a', marginTop: '10px' }}>Previsualización del logotipo activo</span>
            </div>

            <div className="stack" style={{ gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', color: 'var(--text)' }}>
                Cargar nuevo logotipo institucional (PNG, JPG, SVG):
              </label>
              <input
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                className="file-input"
                onChange={handleLogoUpload}
                type="file"
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <Button onClick={resetLogo} type="button" variant="secondary">
                  Restablecer logo predeterminado
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* SECCIÓN 2: COLORES INVERTIDOS */}
        <Card subtitle="Cambia entre el tema estándar claro y el tema de colores invertidos de alto contraste" title="2. Esquema de Colores (Colores Invertidos)">
          <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <button
              onClick={() => handleThemeChange('standard')}
              type="button"
              style={{
                background: theme === 'standard' ? 'var(--surface-strong)' : 'var(--surface)',
                border: '2px solid ' + (theme === 'standard' ? 'var(--text)' : 'var(--border)'),
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>Modo Estándar</strong>
                {theme === 'standard' ? <Icon name="check" size={16} /> : null}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Fondo blanco/claro minimalista con texto oscuro y alto contraste para oficinas.
              </p>
            </button>

            <button
              onClick={() => handleThemeChange('inverted')}
              type="button"
              style={{
                background: theme === 'inverted' ? 'var(--surface-strong)' : 'var(--surface)',
                border: '2px solid ' + (theme === 'inverted' ? 'var(--text)' : 'var(--border)'),
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>Colores Invertidos (Oscuro)</strong>
                {theme === 'inverted' ? <Icon name="check" size={16} /> : null}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Modo invertido de fondo negro/oscuro que reduce el cansancio visual en campo o noche.
              </p>
            </button>
          </div>
        </Card>

        {/* SECCIÓN 3: TAMAÑO DE LAS LETRAS */}
        <Card subtitle="Ajusta la escala global de tipografía y texto de las tablas e interfaz" title="3. Tamaño de las Letras (Tipografía)">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { key: 'sm', label: 'Pequeña (12px)' },
              { key: 'md', label: 'Normal (14px - Predeterminada)' },
              { key: 'lg', label: 'Grande (16px)' },
              { key: 'xl', label: 'Muy Grande (18px)' },
            ].map((sizeItem) => {
              const isSelected = fontSize === sizeItem.key
              return (
                <button
                  key={sizeItem.key}
                  onClick={() => handleFontSizeChange(sizeItem.key as 'sm' | 'md' | 'lg' | 'xl')}
                  type="button"
                  style={{
                    background: isSelected ? 'var(--text)' : 'var(--surface-subtle)',
                    color: isSelected ? 'var(--bg)' : 'var(--text)',
                    border: '1px solid ' + (isSelected ? 'var(--text)' : 'var(--border)'),
                    borderRadius: '6px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sizeItem.label}
                </button>
              )
            })}
          </div>

          <div
            style={{
              background: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Muestra de tipografía en tiempo real:
            </span>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
              Unidad RK17022 · Origen ** MANUEL CASA → Destino ** Corporativo Grupo Secovi (42 min) — Semana 27 (01 Jul 2026).
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
