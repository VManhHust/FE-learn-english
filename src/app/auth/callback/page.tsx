'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { authClient } from '@/lib/auth/authClient'

function AuthCallbackContent() {
  const router = useRouter()
  const { loginWithResult } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (!code) {
      router.replace('/login?error=oauth_failed')
      return
    }

    window.history.replaceState({}, '', '/auth/callback')

    const finishLogin = async () => {
      try {
        const result = await authClient.exchangeOAuthSession(code)
        loginWithResult({ user: result.user })
        router.replace('/dashboard')
      } catch {
        router.replace('/login?error=oauth_failed')
      }
    }

    finishLogin()
  }, [loginWithResult, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
      <p className="text-sm" style={{ color: '#7a7060' }}>Dang xu ly dang nhap...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <p className="text-sm" style={{ color: '#7a7060' }}>Dang xu ly dang nhap...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
