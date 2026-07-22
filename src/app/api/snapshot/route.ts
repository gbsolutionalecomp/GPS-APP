import { NextResponse } from 'next/server'
import { getAppSnapshot } from '@/data/server-snapshot'

export async function GET() {
  return NextResponse.json(await getAppSnapshot(), { headers: { 'cache-control': 'no-store' } })
}
