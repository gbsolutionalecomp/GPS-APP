import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  it('returns status 200 with service information', async () => {
    const response = GET()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.ok).toBe(true)
    expect(data.data.service).toBe('gbs-control-viajes-gps')
  })
})
