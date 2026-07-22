import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/login', '/auth/confirm', '/auth/contrasena', '/api/health']
const adminPaths = ['/programacion', '/reportes', '/catalogos', '/integracion', '/api/importaciones', '/api/admin']

export async function updateSession(request: NextRequest) {
  if (process.env.APP_DATA_MODE !== 'supabase') return NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return NextResponse.next({ request })
  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        for (const item of items) request.cookies.set(item.name, item.value)
        response = NextResponse.next({ request })
        for (const item of items) response.cookies.set(item.name, item.value, item.options)
      },
    },
  })
  const { data } = await supabase.auth.getClaims()
  if (request.nextUrl.pathname === '/login') {
    const target = request.nextUrl.clone(); target.pathname = '/'; target.search = ''
    return NextResponse.redirect(target)
  }
  return response
}

