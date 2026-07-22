import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicConfig } from '@/lib/env'

export async function getSupabaseServerClient() {
  const config = getPublicConfig()
  if (!config) throw new Error('Supabase no está configurado en este ambiente.')
  const store = await cookies()
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try {
          for (const item of items) store.set(item.name, item.value, item.options)
        } catch {
          // Los Server Components no siempre pueden escribir cookies; proxy renueva la sesión.
        }
      },
    },
  })
}
