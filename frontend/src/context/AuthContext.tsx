import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth.api'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import type { Permission, SessionUser } from '../types'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

interface AuthContextValue {
  user: SessionUser | null
  initializing: boolean
  login: (username: string, password: string) => Promise<SessionUser>
  logout: (reason?: string) => Promise<void>
  setUser: (user: SessionUser) => void
  can: (...permissions: Permission[]) => boolean
  logoutReason: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [logoutReason, setLogoutReason] = useState<string | null>(null)
  const idleTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    authApi
      .me()
      .then(setUserState)
      .catch(() => setUserState(null))
      .finally(() => setInitializing(false))
  }, [])

  const logout = useCallback(async (reason?: string) => {
    try {
      await authApi.logout()
    } catch {
      /* session already gone server-side */
    }
    setLogoutReason(reason ?? null)
    setUserState(null)
  }, [])

  useEffect(() => {
    const onExpired = () => {
      setLogoutReason('Your session has expired. Please sign in again.')
      setUserState(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  // Automatic sign-out after inactivity.
  useEffect(() => {
    if (!user) return undefined
    const reset = () => {
      window.clearTimeout(idleTimer.current)
      idleTimer.current = window.setTimeout(
        () => void logout('You were signed out after 15 minutes of inactivity.'),
        IDLE_TIMEOUT_MS,
      )
    }
    reset()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }))
    return () => {
      window.clearTimeout(idleTimer.current)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [user, logout])

  const login = useCallback(async (username: string, password: string) => {
    const loggedIn = await authApi.login(username, password)
    setLogoutReason(null)
    setUserState(loggedIn)
    return loggedIn
  }, [])

  const can = useCallback(
    (...permissions: Permission[]) => Boolean(user && permissions.every((p) => user.permissions.includes(p))),
    [user],
  )

  const value = useMemo(
    () => ({ user, initializing, login, logout, setUser: setUserState, can, logoutReason }),
    [user, initializing, login, logout, can, logoutReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
