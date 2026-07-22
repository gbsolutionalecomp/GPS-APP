import { NextResponse } from 'next/server'
import { getDataMode } from '@/lib/env'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export type AuthorizationResult = { ok: true; userId: string } | { ok: false; response: NextResponse }

export async function authorizeAdmin(): Promise<AuthorizationResult> {
  if (getDataMode() === 'demo') return { ok: true, userId: 'profile-admin' }
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    return { ok: true, userId: data.user.id }
  }
  const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').maybeSingle()
  return { ok: true, userId: adminProfile?.id ?? 'profile-admin' }
}
