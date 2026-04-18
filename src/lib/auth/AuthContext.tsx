'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from './authClient'
import { tokenStore } from './tokenStore'
import type { UserInfo, AccessTokenClaims } from './types'

interface AuthContextValue {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}

function decodeJwtPayload(token: string): AccessTokenClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Pad base64 string if needed
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded) as AccessTokenClaims
  } catch {
    return null
  }
}

function claimsToUser(claims: AccessTokenClaims): UserInfo {
  return {
    id: Number(claims.sub),
    email: claims.email,
    displayName: claims.email, // fallback; server may include displayName in claims
    role: (claims.role as UserInfo['role']) ?? 'USER',
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = tokenStore.getAccessToken()
    if (token) {
      const claims = decodeJwtPayload(token)
      if (claims) {
        setUser(claimsToUser(claims))
      }
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const result = await authClient.login(email, password)
    setUser(result.user)
  }

  async function logout(): Promise<void> {
    await authClient.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
