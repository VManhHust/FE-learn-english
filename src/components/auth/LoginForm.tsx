'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const hasOAuthError = searchParams.get('error') === 'oauth_failed'

  function handleGoogleLogin() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
    setIsGoogleLoading(true)
    window.location.href = `${apiUrl}/api/auth/google`
  }

  return (
    <div className="w-full max-w-[460px]">
      <div className="mb-12 lg:hidden">
        <span className="font-display text-2xl font-semibold">
          <span className="text-[#2c2416] dark:text-[#f0e8d8]">Lingua</span>
          <span className="text-[#d4a853]">Flow</span>
        </span>
      </div>

      <div className="mb-9">
        <div className="mb-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-10 bg-[#d4a853]" />
          <span className="size-1.5 bg-[#d4a853]" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase text-[#b18432] dark:text-[#d4a853]">
          LinguaFlow Account
        </p>
        <h2 className="text-3xl font-bold leading-tight text-[#24211d] dark:text-[#f3eee5] sm:text-4xl">
          Chào mừng trở lại
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#756b5d] dark:text-[#aaa397]">
          Tiếp tục bằng tài khoản Google để vào không gian học tập của bạn.
        </p>
      </div>

      {hasOAuthError && (
        <div
          role="alert"
          className="mb-5 border-l-2 border-[#c0392b] bg-[#c0392b]/[0.06] px-4 py-3 text-sm text-[#a83226] dark:text-[#f28b82]"
        >
          Đăng nhập với Google thất bại. Vui lòng thử lại.
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        className="group relative h-14 w-full rounded-lg border border-[#d8cdbb] bg-white px-5 text-[15px] font-semibold text-[#24211d] shadow-[0_8px_24px_rgba(72,54,25,0.07)] transition-all hover:border-[#c49a49] hover:bg-[#fffdf8] hover:shadow-[0_10px_28px_rgba(72,54,25,0.11)] dark:border-[#3b3a36] dark:bg-[#1b1a18] dark:text-[#f3eee5] dark:hover:border-[#d4a853] dark:hover:bg-[#22211e] disabled:cursor-not-allowed disabled:opacity-65"
      >
        <span className="absolute left-5 flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
          {isGoogleLoading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-[#d8cdbb] border-t-[#4285f4]" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
        </span>
        <span>{isGoogleLoading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}</span>
        {!isGoogleLoading && (
          <ArrowRight className="absolute right-5 size-4 text-[#9a8e7b] transition-transform group-hover:translate-x-0.5 group-hover:text-[#b18432]" aria-hidden="true" />
        )}
      </Button>

      <div className="mt-7 flex items-start gap-3 border-t border-[#e4ddd1] pt-5 dark:border-[#302f2c]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#4f7d68] dark:text-[#75a58e]" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-[#3e3932] dark:text-[#ddd7cc]">Đăng nhập an toàn</p>
          <p className="mt-1 text-xs leading-5 text-[#817769] dark:text-[#999287]">
            LinguaFlow không lưu mật khẩu Google của bạn.
          </p>
        </div>
      </div>
    </div>
  )
}
