'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { tokenStore } from '@/lib/auth/tokenStore'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')

    if (!accessToken) {
      router.replace('/login?error=oauth_failed')
      return
    }

    // Lưu access token vào memory/localStorage
    tokenStore.setAccessToken(accessToken)

    // Xóa token khỏi URL ngay lập tức để không lưu vào browser history
    // refresh token đã được BE set vào HttpOnly cookie trong redirect response
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/auth/callback')
    }

    router.replace('/dashboard')
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
      <p className="text-sm" style={{ color: '#7a7060' }}>Đang xử lý đăng nhập...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <p className="text-sm" style={{ color: '#7a7060' }}>Đang xử lý đăng nhập...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
