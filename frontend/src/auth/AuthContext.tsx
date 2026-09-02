import { useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AuthUser, LoginCredentials } from './types'
import { fetchCurrentUser, loginApi, logoutApi } from '../api/endpoints'
import { onAuthExpired } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    localStorage.removeItem('dashboard_auth_user')
    const stop = onAuthExpired(() => setUser(null))
    let cancelled = false

    ;(async () => {
      const result = await fetchCurrentUser()
      if (!cancelled && result.ok) setUser(result.data.user)
      if (!cancelled) setIsLoading(false)
    })()

    return () => {
      cancelled = true
      stop()
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const apiResult = await loginApi(credentials.username, credentials.password, credentials.role)
    if (!apiResult.ok) {
      return { success: false, error: apiResult.error || 'Invalid username or password' }
    }
    setUser(apiResult.data.user)
    return { success: true, user: apiResult.data.user }
  }, [])

  const logout = useCallback(async () => {
    await logoutApi()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
