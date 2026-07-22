import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeAdmin } from '@/lib/authorization'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({ fullName: z.string().trim().min(3).max(120), email: z.string().trim().email().max(254) })

export async function POST(request: Request) {
  const authorization = await authorizeAdmin()
  if (!authorization.ok) return authorization.response
  try {
    const input = bodySchema.parse(await request.json())
    const admin = getSupabaseAdminClient()
    const invitation = await admin.auth.admin.inviteUserByEmail(input.email.toLowerCase(), { data: { full_name: input.fullName } })
    if (invitation.error || !invitation.data.user) throw invitation.error ?? new Error('No se creó el usuario.')
    const profile = await admin.from('profiles').upsert({ id: invitation.data.user.id, full_name: input.fullName, email: input.email.toLowerCase(), role: 'engineer', active: true })
    if (profile.error) throw profile.error
    return NextResponse.json({ ok: true, id: invitation.data.user.id })
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : 'No fue posible invitar al ingeniero.' }, { status: 422 })
  }
}
