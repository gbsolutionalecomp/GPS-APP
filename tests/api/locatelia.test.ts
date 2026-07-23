import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/locatelia/route'

describe('POST /api/webhooks/locatelia', () => {
  it('processes valid payload and returns 200', async () => {
    const payload = [
      {
        plate: 'UNIDAD-99',
        actualStart: '2026-07-23T08:00:00.000Z',
        actualEnd: '2026-07-23T10:00:00.000Z',
        distance: '45.5',
      },
    ]

    const req = new NextRequest('http://localhost:3000/api/webhooks/locatelia', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.processed).toBe(1)
  })
})
