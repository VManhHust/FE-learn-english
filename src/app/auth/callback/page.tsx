'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { tokenStore } from '@/lib/auth/tokenStore'
import { useAuth } from '@/lib/auth/AuthContext'

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const padded = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithResult } = useAuth()
  // Dùng ref để đảm bảo chỉ xử lý đúng 1 lần, tránh loop khi searchParams thay đổi
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    // Đọc token từ URL ngay lập tức trước khi xóa
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('accessToken')
    const refreshToken = urlParams.get('refreshToken')

    if (!accessToken) {
      router.replace('/login?error=oauth_failed')
      return
    }

    // Xóa token khỏi URL ngay để không lưu vào history
    window.history.replaceState({}, '', '/auth/callback')

    // Lưu access token vào localStorage
    tokenStore.setAccessToken(accessToken)

    // Set refresh token cookie qua Next.js API route (cùng domain → cookie hoạt động đúng)
    const finishLogin = async () => {
      if (refreshToken) {
        await tokenStore.setRefreshCookie(refreshToken)
      }

      // Decode JWT để lấy user info và cập nhật AuthContext
      const claims = decodeJwtPayload(accessToken)
      if (claims) {
        loginWithResult({
          user: {
            id: Number(claims.sub),
            email: claims.email,
            displayName: claims.displayName || claims.email,
            role: claims.role ?? 'USER',
          },
        })
      }

      router.replace('/dashboard')
    }

    finishLogin()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
