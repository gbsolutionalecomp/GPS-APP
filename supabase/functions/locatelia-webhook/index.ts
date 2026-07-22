import { createClient } from 'npm:@supabase/supabase-js@2'
import { normalizeTrips, saveTrips } from '../_shared/locatelia.ts'

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (request.headers.get('x-locatelia-secret') !== Deno.env.get('LOCATELIA_WEBHOOK_SECRET')) return new Response('Unauthorized', { status: 401 })
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const run = await client.from('sync_runs').insert({ source: 'locatelia_webhook', status: 'running' }).select('id').single()
  try {
    const trips = await normalizeTrips(client, await request.json())
    const result = await saveTrips(client, trips, 'locatelia_webhook')
    await client.from('sync_runs').update({ status: 'success', finished_at: new Date().toISOString(), received: trips.length, ...result }).eq('id', run.data?.id)
    return Response.json({ accepted: trips.length, ...result })
  } catch (error) {
    await client.from('sync_runs').update({ status: 'error', finished_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : 'Error de webhook' }).eq('id', run.data?.id)
    return Response.json({ error: 'No fue posible procesar Locatelia.' }, { status: 422 })
  }
})
