import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth hook', () => {
  it('manages login and logout state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()

    act(() => {
      result.current.login('admin@gbs.com', 'admin')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.user?.email).toBe('admin@gbs.com')

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
