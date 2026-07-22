import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const PASSWORD_TYPES = new Set<EmailOtpType>(['invite', 'recovery'])

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const supabase = await getSupabaseServerClient()

  let errorMessage: string | undefined
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    errorMessage = result.error?.message
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    errorMessage = result.error?.message
  } else {
    errorMessage = 'El enlace de confirmación está incompleto.'
  }

  if (errorMessage) {
    const target = new URL('/login', url.origin)
    target.searchParams.set('error', 'confirm_failed')
    return NextResponse.redirect(target)
  }

  const requiresPassword = type ? PASSWORD_TYPES.has(type) : false
  const next = url.searchParams.get('next') || (requiresPassword ? '/auth/contrasena' : '/')
  return NextResponse.redirect(new URL(next, url.origin))
}
