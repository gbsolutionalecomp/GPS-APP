import { getDataMode } from '@/lib/env'
import { apiSuccess } from '@/lib/api-response'

export function GET() {
  return apiSuccess(
    {
      ok: true,
      service: 'gbs-control-viajes-gps',
      dataMode: getDataMode(),
      supabase: getDataMode() === 'supabase' ? 'configured' : 'demo_mode',
      checkedAt: new Date().toISOString(),
    },
    200,
    { 'cache-control': 'no-store' }
  )
}
