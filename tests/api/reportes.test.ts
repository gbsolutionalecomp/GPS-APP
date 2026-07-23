import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/reportes/export/route'

describe('GET /api/reportes/export', () => {
  it('exports CSV format', async () => {
    const req = new NextRequest('http://localhost:3000/api/reportes/export?format=csv')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
  })

  it('exports Excel format', async () => {
    const req = new NextRequest('http://localhost:3000/api/reportes/export?format=excel')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
  })

  it('exports PDF format', async () => {
    const req = new NextRequest('http://localhost:3000/api/reportes/export?format=pdf')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/pdf')
  })
})
