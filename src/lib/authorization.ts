import { NextResponse } from 'next/server'
import { getDataMode } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export type AuthorizationResult = { ok: true; userId: string } | { ok: false; response: NextResponse }

export async function authorizeAdmin(): Promise<AuthorizationResult> {
  if (getDataMode() === 'demo') return { ok: true, userId: 'profile-admin' }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return { ok: false, response: NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role, active').eq('id', data.user.id).maybeSingle()
  if (!profile?.active || profile.role !== 'admin') return { ok: false, response: NextResponse.json({ error: 'Permiso de administrador requerido.' }, { status: 403 }) }
  return { ok: true, userId: data.user.id }
}
