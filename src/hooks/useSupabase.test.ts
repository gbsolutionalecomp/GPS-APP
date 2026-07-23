import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSupabase } from './useSupabase'

describe('useSupabase hook', () => {
  it('returns isConfigured state', () => {
    const { result } = renderHook(() => useSupabase())
    expect(typeof result.current.isConfigured).toBe('boolean')
  })
})
