'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { axiosInstance } from '@/lib/auth/authClient'

interface RegisterModalProps {
  onClose: () => void
}

function getRegisterError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i m\u00e1y ch\u1ee7. Vui l\u00f2ng ki\u1ec3m tra k\u1ebft n\u1ed1i m\u1ea1ng.'
    if (error.response.status === 409) return 'Email n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u0103ng k\u00fd.'
    if (error.response.status === 400) return error.response.data?.error ?? 'D\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7.'
  }
  return '\u0110\u00e3 c\u00f3 l\u1ed7i x\u1ea3y ra. Vui l\u00f2ng th\u1eed l\u1ea1i.'
}

export default function RegisterModal({ onClose }: RegisterModalProps) {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await axiosInstance.post('/api/auth/register', { email, password, displayName })
      await login(email, password)
      router.replace('/dashboard')
    } catch (err) {
      setError(getRegisterError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 space-y-6 relative"
        style={{ backgroundColor: '#faf8f3', border: '1px solid #e0d8c8' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sm"
          style={{ color: '#7a7060' }}
          aria-label="Close"
        >
          {'\u2715'}
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-display" style={{ color: '#2c2c2c' }}>
            {'\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n'}
          </h2>
          <p className="text-sm" style={{ color: '#7a7060' }}>
            {'\u0110\u0103ng k\u00fd mi\u1ec5n ph\u00ed. Kh\u00f4ng c\u1ea7n th\u1ebb t\u00edn d\u1ee5ng.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className="block text-sm font-medium" style={{ color: '#2c2c2c' }}>
              {'\u0110\u1eb7t t\u00ean hi\u1ec3n th\u1ecb'}
            </label>
            <input
              id="reg-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={'\u0110\u1eb7t t\u00ean c\u1ee7a b\u1ea1n'}
              className="input-field"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="block text-sm font-medium" style={{ color: '#2c2c2c' }}>
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="ban@example.com"
              className="input-field"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="block text-sm font-medium" style={{ color: '#2c2c2c' }}>
              {'\u004d\u1eadt kh\u1ea9u'}
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder={'\u0054\u1ed1i thi\u1ec3u 8 k\u00fd t\u1ef1'}
                className="input-field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: '#7a7060' }}
              >
                {showPassword ? '\u1ea8n' : 'Hi\u1ec7n'}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(192,57,43,0.08)',
                border: '1px solid rgba(192,57,43,0.3)',
                color: '#c0392b',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center gap-2"
            style={{ opacity: isLoading ? 0.7 : undefined }}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading
              ? '\u0110ang t\u1ea1o t\u00e0i kho\u1ea3n...'
              : '\u0110\u0103ng k\u00fd'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: '#7a7060' }}>
          {'\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n?'}{' '}
          <button onClick={onClose} className="link-accent font-medium">
            {'\u0110\u0103ng nh\u1eadp'}
          </button>
        </p>
      </div>
    </div>
  )
}
