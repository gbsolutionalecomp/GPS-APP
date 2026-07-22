import { fileURLToPath } from 'node:url'

if (process.env.VERCEL_ENV === 'production') {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  const missing = required.filter((name) => !process.env[name]?.trim())
  if (process.env.APP_DATA_MODE !== 'supabase' || missing.length > 0) {
    throw new Error(`Configuracion de produccion incompleta: ${missing.join(', ') || 'APP_DATA_MODE debe ser supabase'}.`)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ancla la raíz del workspace a esta carpeta: sin esto, Turbopack infiere la raíz a partir del cwd del
  // proceso que lo invoca y puede fallar al resolver "next" cuando se lanza desde fuera de GPS PROYECTOS.
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  experimental: {
    serverActions: { bodySizeLimit: '12mb' },
  },
  async headers() {
    const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const isDev = process.env.NODE_ENV !== 'production'
    const cspDirectives = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`.trim(),
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
      `connect-src 'self' ${supabaseOrigin} wss://*.supabase.co`.trim(),
      "font-src 'self'",
    ]

    if (!isDev) {
      cspDirectives.push('upgrade-insecure-requests')
    }

    const headers = [
      { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
    ]
    if (!isDev) {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' })
    }
    return [{ source: '/:path*', headers }]
  },
}

export default nextConfig
