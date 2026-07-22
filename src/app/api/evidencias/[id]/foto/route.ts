import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: evidence, error } = await supabase.from('odometer_evidence').select('storage_path').eq('id', id).maybeSingle()
  if (error || !evidence) return new Response('No encontrada', { status: 404 })
  const file = await supabase.storage.from('odometer-evidence').download(evidence.storage_path)
  if (file.error) return new Response('No encontrada', { status: 404 })
  return new Response(await file.data.arrayBuffer(), { headers: { 'content-type': file.data.type || 'image/jpeg', 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff' } })
}
