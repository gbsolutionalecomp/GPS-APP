import { createClient } from '@supabase/supabase-js'
import { getAdminConfig } from '@/lib/env'

export function getSupabaseAdminClient() {
  const config = getAdminConfig()
  if (!config) throw new Error('Supabase service role no está configurado en este ambiente.')
  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  })
}
