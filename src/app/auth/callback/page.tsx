'use client'
import { Suspense } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { tokenStore } from '@/lib/auth/tokenStore'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')

    if (accessToken && refreshToken) {
      tokenStore.setAccessToken(accessToken)
      tokenStore.setRefreshCookie(refreshToken).then(() => {
        router.replace('/dashboard')
      })
    } else {
      router.replace('/login?error=oauth_failed')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
      <p className="text-sm" style={{ color: '#7a7060' }}>Đang xử lý đăng nhập...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <p className="text-sm" style={{ color: '#7a7060' }}>Đang xử lý đăng nhập...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
