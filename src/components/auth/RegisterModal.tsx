'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { authClient } from '@/lib/auth/authClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RegisterModalProps {
  onClose: () => void
}

// --- Validation ---
function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email không được để trống'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không đúng định dạng'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'Mật khẩu không được để trống'
  if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự'
  if (!/[A-Za-z]/.test(password)) return 'Mật khẩu phải chứa ít nhất một chữ cái'
  if (!/[0-9]/.test(password)) return 'Mật khẩu phải chứa ít nhất một chữ số'
  return null
}

function getApiError(error: unknown, context: 'sendOtp' | 'register'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
    const status = error.response.status
    if (context === 'sendOtp') {
      if (status === 409) return 'Email này đã được đăng ký.'
      if (status === 429) return 'Vui lòng chờ trước khi gửi lại mã.'
      return 'Không thể gửi mã xác thực. Vui lòng thử lại.'
    }
    if (context === 'register') {
      if (status === 400) return 'Mã xác thực không đúng hoặc đã hết hạn.'
      return 'Không thể tạo tài khoản. Vui lòng thử lại.'
    }
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { level: 1, label: 'Yếu', color: '#c0392b' }
  if (score === 2) return { level: 2, label: 'Trung bình', color: '#e67e22' }
  return { level: 3, label: 'Mạnh', color: '#27ae60' }
}

// --- OTP Input: 6 ô riêng biệt dùng shadcn Input ---
function OtpInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(idx: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1)
    const arr = value.padEnd(6, ' ').split('')
    arr[idx] = digit || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!value[idx] || value[idx] === ' ') {
        if (idx > 0) inputsRef.current[idx - 1]?.focus()
      } else {
        const arr = value.padEnd(6, ' ').split('')
        arr[idx] = ' '
        onChange(arr.join('').trimEnd())
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputsRef.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] ?? ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          aria-label={`Ký tự OTP thứ ${idx + 1}`}
          className="w-11 h-12 text-center text-lg font-semibold px-0
            bg-[#faf8f3] border-[1.5px] border-[#e0d8c8] text-[#2c2c2c]
            focus-visible:ring-0 focus-visible:border-[#d4a853]
            dark:bg-[#252836] dark:border-[#2e3142] dark:text-[#e8e3d8]
            dark:focus-visible:border-[#d4a853]"
        />
      ))}
    </div>
  )
}

// --- Spinner ---
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// --- Error Alert ---
function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="px-4 py-3 rounded-lg text-sm"
      style={{
        backgroundColor: 'rgba(192,57,43,0.08)',
        border: '1px solid rgba(192,57,43,0.3)',
        color: '#c0392b',
      }}
    >
      {message}
    </div>
  )
}

// --- Input class helper (giống LoginForm) ---
const inputClass =
  'w-full px-4 py-3 h-11 rounded-lg text-sm outline-none transition-all ' +
  'bg-[#faf8f3] border-[1.5px] border-[#e0d8c8] text-[#2c2c2c] ' +
  'focus-visible:ring-0 focus-visible:border-[#d4a853] ' +
  'dark:bg-[#252836] dark:border-[#2e3142] dark:text-[#e8e3d8] ' +
  'dark:placeholder:text-[#6b7280] dark:focus-visible:border-[#d4a853]'

// --- Main Component ---
export default function RegisterModal({ onClose }: RegisterModalProps) {
  const { loginWithResult } = useAuth()
  const router = useRouter()

  // Step 1 state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Step 2 state
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otpValue, setOtpValue] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)

  // Shared state
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const passwordStrength = getPasswordStrength(password)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    setEmailError(emailErr)
    setPasswordError(passwordErr)
    if (emailErr || passwordErr) return

    setApiError(null)
    setIsLoading(true)
    try {
      await authClient.sendOtp(email)
      setStep('otp')
      setCountdown(60)
    } catch (err) {
      setApiError(getApiError(err, 'sendOtp'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return
    setApiError(null)
    setOtpError(null)
    setIsLoading(true)
    try {
      await authClient.sendOtp(email)
      setOtpValue('')
      setCountdown(60)
    } catch (err) {
      setApiError(getApiError(err, 'sendOtp'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    const code = otpValue.replace(/\s/g, '')
    if (code.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số')
      return
    }
    setOtpError(null)
    setApiError(null)
    setIsLoading(true)
    try {
      const result = await authClient.register(email, password, code, displayName.trim() || undefined)
      loginWithResult(result)
      router.replace('/dashboard')
    } catch (err) {
      setApiError(getApiError(err, 'register'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl p-8 space-y-6 relative
        bg-[#faf8f3] dark:bg-[#0f0e0c]
        border border-[#e0d8c8] dark:border-[#2e3142]">

        {/* Close button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 h-8 w-8 p-0
            text-[#7a7060] hover:text-[#2c2c2c] hover:bg-[#ede4d0]
            dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-[#2e3142]"
        >
          ✕
        </Button>

        {/* ===== STEP 1: Form ===== */}
        {step === 'form' && (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-bold text-[#2c2c2c] dark:text-gray-100">
                Đăng ký tài khoản
              </h2>
              <p className="text-sm text-[#7a7060] dark:text-gray-400">
                Đăng ký miễn phí. Không cần thẻ tín dụng.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
              {/* Display name */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-sm font-medium text-[#2c2c2c] dark:text-gray-200">
                  Tên hiển thị
                </Label>
                <Input
                  id="reg-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Đặt tên của bạn"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-sm font-medium text-[#2c2c2c] dark:text-gray-200">
                  Email
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); setApiError(null) }}
                  placeholder="ban@example.com"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'reg-email-error' : undefined}
                  className={inputClass}
                />
                {emailError && (
                  <p id="reg-email-error" className="text-xs text-[#c0392b]">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm font-medium text-[#2c2c2c] dark:text-gray-200">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(null); setApiError(null) }}
                    placeholder="Tối thiểu 8 ký tự"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'reg-password-error' : password ? 'reg-password-strength' : undefined}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7a7060] dark:text-gray-400"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && !passwordError && (
                  <div className="space-y-1" id="reg-password-strength" aria-live="polite">
                    <div className="flex gap-1">
                      {([1, 2, 3] as const).map((lvl) => (
                        <div
                          key={lvl}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{ backgroundColor: passwordStrength.level >= lvl ? passwordStrength.color : '#e0d8c8' }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: passwordStrength.color }}>{passwordStrength.label}</p>
                  </div>
                )}
                {passwordError && (
                  <p id="reg-password-error" className="text-xs text-[#c0392b]">
                    {passwordError}
                  </p>
                )}
              </div>

              {apiError && <ErrorAlert message={apiError} />}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                  bg-[#d4a853] hover:bg-[#c49843] text-[#faf8f3]
                  disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && <Spinner />}
                {isLoading ? 'Đang gửi mã...' : 'Tiếp theo'}
              </Button>
            </form>

            <p className="text-center text-sm text-[#7a7060] dark:text-gray-400">
              Đã có tài khoản?{' '}
              <button onClick={onClose} className="link-accent font-medium">Đăng nhập</button>
            </p>
          </>
        )}

        {/* ===== STEP 2: OTP ===== */}
        {step === 'otp' && (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-sans font-bold text-[#2c2c2c] dark:text-gray-100">
                Xác thực email
              </h2>
              <p className="text-sm text-[#7a7060] dark:text-gray-400">
                Mã 6 số đã được gửi đến{' '}
                <span className="font-medium text-[#2c2c2c] dark:text-gray-200">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="space-y-5" noValidate>
              <div className="space-y-2">
                <OtpInput
                  value={otpValue}
                  onChange={(v) => { setOtpValue(v); setOtpError(null); setApiError(null) }}
                />
                {otpError && (
                  <p className="text-xs text-center text-[#c0392b]">{otpError}</p>
                )}
              </div>

              {apiError && <ErrorAlert message={apiError} />}

              <Button
                type="submit"
                disabled={isLoading || otpValue.replace(/\s/g, '').length < 6}
                className="w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                  bg-[#d4a853] hover:bg-[#c49843] text-[#faf8f3]
                  disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && <Spinner />}
                {isLoading ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
              </Button>
            </form>

            {/* Resend + back */}
            <div className="flex items-center justify-between text-sm text-[#7a7060] dark:text-gray-400">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setStep('form'); setOtpValue(''); setApiError(null) }}
                className="h-auto p-0 text-sm font-normal text-[#7a7060] dark:text-gray-400
                  hover:text-[#2c2c2c] dark:hover:text-gray-200 hover:bg-transparent"
              >
                ← Sửa email
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className="h-auto p-0 text-sm font-medium link-accent hover:bg-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
