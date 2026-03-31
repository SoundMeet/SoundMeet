/**
 * MockAuthContext
 *
 * Provides mock auth state for development. When real auth is ready,
 * replace the useState logic inside MockAuthProvider with your real
 * auth provider (Supabase session, JWT, etc.) — the useAuth() interface
 * stays the same so all consumers require zero changes.
 */
import { createContext, useContext, useState } from 'react'
import { MOCK_AUTHENTICATED_USER, MOCK_GUEST } from '../data/mockUser'

const MockAuthContext = createContext(null)

export function MockAuthProvider({ children }) {
  const [user, setUser] = useState(MOCK_GUEST)

  const login = () => setUser(MOCK_AUTHENTICATED_USER)
  const logout = () => setUser(MOCK_GUEST)

  return (
    <MockAuthContext.Provider value={{ user, login, logout, isAuthenticated: user.isAuthenticated }}>
      {children}
    </MockAuthContext.Provider>
  )
}

/** Consume auth state anywhere inside MockAuthProvider */
export function useAuth() {
  const ctx = useContext(MockAuthContext)
  if (!ctx) throw new Error('useAuth must be used inside MockAuthProvider')
  return ctx
}
