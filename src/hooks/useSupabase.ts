'use client'

import { useState } from 'react'
import { getPublicConfig } from '@/lib/env'

export function useSupabase() {
  const [isConfigured] = useState(() => {
    try {
      const config = getPublicConfig()
      return Boolean(config)
    } catch {
      return false
    }
  })

  return { isConfigured }
}
