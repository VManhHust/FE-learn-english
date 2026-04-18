'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import axios from 'axios'
import RegisterModal from './RegisterModal'

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')
}

function validateEmail(email: string): string | null {
  if (!email) return 'Email không được để trống'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Email không đúng định dạng'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Mật khẩu không được để trống'
  return null
}

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
    }
    if (error.response.status === 401) {
      return 'Email hoặc mật khẩu không đúng'
    }
    if (error.response.status === 429) {
      return 'Quá nhiều lần thử. Vui lòng thử lại sau.'
    }
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

export default function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    setApiError(null)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    setApiError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    setEmailError(emailErr)
    setPasswordError(passwordErr)

    if (emailErr || passwordErr) return

    setIsLoading(true)
    setApiError(null)

    try {
      await login(email, password)

      const redirectParam = searchParams.get('redirect')
      if (redirectParam && !isAbsoluteUrl(redirectParam)) {
        router.replace(redirectParam)
      } else {
        router.replace('/dashboard')
      }
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {/* Mobile logo */}
      <div className="lg:hidden text-center">
        <span className="text-2xl font-display font-semibold" style={{ color: '#c8a84b' }}>
          LinguaFlow
        </span>
      </div>

      {/* Heading */}
      <div className="space-y-1">
        <h2 className="text-3xl font-display" style={{ color: '#2c2c2c' }}>
          Chào mừng trở lại
        </h2>
        <p className="text-sm" style={{ color: '#7a7060' }}>
          Tiếp tục hành trình học tiếng Anh của bạn
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#2c2c2c' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="ban@example.com"
            className="input-field"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="text-xs" style={{ color: '#c0392b' }}>
              {emailError}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#2c2c2c' }}>
              Mật khẩu
            </label>
            <a href="#" className="text-xs link-accent">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className="input-field pr-11"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: '#7a7060' }}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
          {passwordError && (
            <p id="password-error" className="text-xs" style={{ color: '#c0392b' }}>
              {passwordError}
            </p>
          )}
        </div>

        {/* API Error banner */}
        {apiError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(192, 57, 43, 0.08)',
              border: '1px solid rgba(192, 57, 43, 0.3)',
              color: '#c0392b',
            }}
          >
            {apiError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center justify-center gap-2"
          style={{ opacity: isLoading ? 0.7 : undefined, cursor: isLoading ? 'not-allowed' : undefined }}
        >
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: '#e0d8c8' }} />
        <span className="text-xs" style={{ color: '#7a7060' }}>hoặc</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#e0d8c8' }} />
      </div>

      {/* Google login */}
      <button type="button" onClick={handleGoogleLogin} className="btn-secondary">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Tiếp tục với Google
      </button>

      {/* Sign up link */}
      <p className="text-center text-sm" style={{ color: '#7a7060' }}>
        Chưa có tài khoản?{' '}
        <a href="#" className="link-accent" onClick={(e) => { e.preventDefault(); setShowRegister(true) }}>
          {'\u0110\u0103ng k\u00fd mi\u1ec5n ph\u00ed'}
        </a>
      </p>
    </div>
  )
}
