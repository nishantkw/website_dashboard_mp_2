import { useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AuthUser, LoginCredentials } from './types'
import { authenticateUser } from './mockUsers'
import { loginApi } from '../api/endpoints'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'dashboard_auth_user'

function isValidStoredUser(parsed: unknown): parsed is AuthUser {
  if (!parsed || typeof parsed !== 'object') return false
  const role = (parsed as AuthUser).role
  return (
    role === 'super_admin' ||
    role === 'state_admin' ||
    role === 'bis_user' ||
    role === 'mp_user' ||
    role === 'ump_user'
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (isValidStoredUser(parsed)) {
          setUser(parsed)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const apiResult = await loginApi(credentials.username, credentials.password, credentials.role)
    if (apiResult.ok) {
      const authUser = apiResult.data.user
      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return { success: true, user: authUser }
    }

    const authUser = authenticateUser(
      credentials.username,
      credentials.password,
      credentials.role
    )
    if (!authUser) {
      return { success: false, error: apiResult.error || 'Invalid username, password, or role' }
    }
    setUser(authUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    return { success: true, user: authUser }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { useAuth } from './auth-context'
