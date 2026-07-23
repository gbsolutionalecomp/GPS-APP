import { describe, it, expect } from 'vitest'
import { apiSuccess, apiError } from './api-response'

describe('API response helper', () => {
  it('formats success response correctly', async () => {
    const res = apiSuccess({ foo: 'bar' }, 200)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual({ foo: 'bar' })
    expect(json.timestamp).toBeDefined()
  })

  it('formats error response correctly', async () => {
    const res = apiError('Bad Request', 400)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Bad Request')
    expect(json.timestamp).toBeDefined()
  })
})
