'use client'

import { useState } from 'react'

export interface UserSession {
  email: string
  role: 'admin' | 'ingeniero'
}

export function useAuth(initialUser: UserSession | null = null) {
  const [user, setUser] = useState<UserSession | null>(initialUser)

  const login = (email: string, role: 'admin' | 'ingeniero' = 'ingeniero') => {
    setUser({ email, role })
  }

  const logout = () => {
    setUser(null)
  }

  return {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    logout,
  }
}
