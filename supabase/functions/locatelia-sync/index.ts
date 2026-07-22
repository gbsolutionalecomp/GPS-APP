import { createClient } from 'npm:@supabase/supabase-js@2'
import { normalizeTrips, saveTrips } from '../_shared/locatelia.ts'

Deno.serve(async (request) => {
  if (request.headers.get('x-cron-secret') !== Deno.env.get('LOCATELIA_CRON_SECRET')) return new Response('Unauthorized', { status: 401 })
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const run = await client.from('sync_runs').insert({ source: 'locatelia_api', status: 'running' }).select('id').single()
  try {
    const endpoint = Deno.env.get('LOCATELIA_API_URL'); const token = Deno.env.get('LOCATELIA_API_TOKEN')
    if (!endpoint || !token) throw new Error('Locatelia API no está configurada; use importación hasta recibir credenciales.')
    const response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } })
    if (!response.ok) throw new Error(`Locatelia devolvió ${response.status}.`)
    const trips = await normalizeTrips(client, await response.json())
    const result = await saveTrips(client, trips, 'locatelia_api')
    await client.from('integration_settings').update({ mode: 'api', last_synced_at: new Date().toISOString(), last_successful_at: new Date().toISOString() }).eq('provider', 'locatelia')
    await client.from('sync_runs').update({ status: 'success', finished_at: new Date().toISOString(), received: trips.length, ...result }).eq('id', run.data?.id)
    return Response.json({ received: trips.length, ...result })
  } catch (error) {
    await client.from('integration_settings').update({ mode: 'import', last_synced_at: new Date().toISOString() }).eq('provider', 'locatelia')
    await client.from('sync_runs').update({ status: 'warning', finished_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : 'Error de sincronización' }).eq('id', run.data?.id)
    return Response.json({ mode: 'import', message: 'Sin API operativa: la app continúa por importación.' }, { status: 202 })
  }
})
