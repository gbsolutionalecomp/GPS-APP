import { NextResponse } from 'next/server'
import { getDataMode } from '@/lib/env'

export function GET() {
  return NextResponse.json({ ok: true, service: 'gbs-control-viajes-gps', dataMode: getDataMode(), checkedAt: new Date().toISOString() }, { headers: { 'cache-control': 'no-store' } })
}
