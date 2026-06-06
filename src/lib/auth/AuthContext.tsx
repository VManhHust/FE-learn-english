'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from './authClient'
import { tokenStore } from './tokenStore'
import type { UserInfo, AccessTokenClaims } from './types'

interface AuthContextValue {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  loginWithResult(result: { user: UserInfo }): void
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

function isTokenExpired(claims: AccessTokenClaims): boolean {
  // claims.exp là Unix timestamp (giây), thêm buffer 10s để tránh race condition
  return Date.now() / 1000 > claims.exp - 10
}

function claimsToUser(claims: AccessTokenClaims): UserInfo {
  return {
    id: Number(claims.sub),
    email: claims.email,
    displayName: claims.displayName || claims.email, // fallback email nếu token cũ chưa có displayName
    role: (claims.role as UserInfo['role']) ?? 'USER',
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function initAuth() {
      const token = tokenStore.getAccessToken()
      if (token) {
        const claims = decodeJwtPayload(token)
        if (claims && !isTokenExpired(claims)) {
          // Token còn hạn — dùng luôn
          setUser(claimsToUser(claims))
        } else {
          // Token hết hạn hoặc không decode được — thử refresh
          tokenStore.clearAccessToken()
          try {
            const { accessToken } = await authClient.refreshToken()
            const freshClaims = decodeJwtPayload(accessToken)
            if (freshClaims && !isTokenExpired(freshClaims)) {
              setUser(claimsToUser(freshClaims))
            }
          } catch {
            // Refresh thất bại — user chưa đăng nhập
          }
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const result = await authClient.login(email, password)
    setUser(result.user)
  }

  function loginWithResult(result: { user: UserInfo }): void {
    setUser(result.user)
  }

  async function logout(): Promise<void> {
    await authClient.logout()
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        loginWithResult,
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
