import { z } from 'zod'

export type DataMode = 'demo' | 'supabase'

function optional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined
}

export function getDataMode(): DataMode {
  return z.enum(['demo', 'supabase']).parse(optional('APP_DATA_MODE') ?? 'demo')
}

export function getPublicConfig(): { url: string; publishableKey: string } | null {
  const url = optional('NEXT_PUBLIC_SUPABASE_URL')
  const publishableKey = optional('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  if (!url && !publishableKey) return null
  if (!url || !publishableKey) throw new Error('La configuración pública de Supabase está incompleta.')
  return { url: z.string().url().parse(url), publishableKey: z.string().min(20).parse(publishableKey) }
}

export function getAdminConfig(): { url: string; serviceRoleKey: string } | null {
  const publicConfig = getPublicConfig()
  const serviceRoleKey = optional('SUPABASE_SERVICE_ROLE_KEY')
  if (!publicConfig && !serviceRoleKey) return null
  if (!publicConfig || !serviceRoleKey) throw new Error('La configuración administrativa de Supabase está incompleta.')
  return { url: publicConfig.url, serviceRoleKey: z.string().min(20).parse(serviceRoleKey) }
}
