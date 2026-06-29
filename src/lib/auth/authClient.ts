import axios, { AxiosRequestConfig } from 'axios'
import { tokenStore } from './tokenStore'
import type { UserInfo } from './types'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: UserInfo
}

export interface TokenPair {
  accessToken: string
  refreshToken?: string
}

function userFromAccessToken(accessToken: string): UserInfo {
  const parts = accessToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid access token')
  }

  const padded = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4)
  const claims = JSON.parse(atob(padded)) as {
    sub: string
    email: string
    displayName?: string
    role?: UserInfo['role']
  }

  return {
    id: Number(claims.sub),
    email: claims.email,
    displayName: claims.displayName || claims.email,
    role: claims.role ?? 'USER',
  }
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  withCredentials: true,
})

// --- Refresh queue state ---
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function resolveQueue(token: string) {
  pendingQueue.forEach((p) => p.resolve(token))
  pendingQueue = []
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach((p) => p.reject(err))
  pendingQueue = []
}

// --- Request interceptor: attach access token ---
axiosInstance.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Các endpoint auth không bao giờ trigger refresh flow khi nhận 401
// (lỗi 401 ở đây có nghĩa là sai credentials, không phải token hết hạn)
const AUTH_ENDPOINTS_NO_RETRY = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/register/send-otp',
  '/api/auth/refresh',
  '/api/auth/oauth/session',
  '/api/auth/forgot-password/send-otp',
  '/api/auth/forgot-password/verify-otp',
  '/api/auth/forgot-password/reset',
]

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return AUTH_ENDPOINTS_NO_RETRY.some((path) => url.includes(path))
}

// --- Response interceptor: handle 401 with refresh + queue ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401

    // Không retry nếu là auth endpoint (sai credentials) hoặc đã retry rồi
    if (is401 && !isAuthEndpoint(originalRequest.url) && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
              originalRequest._retry = true
              originalRequest.headers = {
                ...(originalRequest.headers ?? {}),
                Authorization: `Bearer ${token}`,
              }
              resolve(axiosInstance(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { accessToken } = await authClient.refreshToken()
        resolveQueue(accessToken)
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        }
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        rejectQueue(refreshError)
        tokenStore.clearAccessToken()
        try {
          await tokenStore.clearRefreshCookie()
        } catch {
          // The refresh proxy also clears invalid cookies. Do not block redirect
          // if the cleanup endpoint is temporarily unavailable.
        }
        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authClient = {
  async login(email: string, password: string): Promise<LoginResult> {
    const response = await axiosInstance.post<{
      accessToken: string
      refreshToken: string
      user: UserInfo
    }>('/api/auth/login', { email, password })

    const { accessToken, refreshToken, user } = response.data
    tokenStore.setAccessToken(accessToken)
    await tokenStore.setRefreshCookie(refreshToken)

    return { accessToken, refreshToken, user }
  },

  async sendOtp(email: string): Promise<void> {
    await axiosInstance.post('/api/auth/register/send-otp', { email })
  },

  async register(
    email: string,
    password: string,
    otpCode: string,
    displayName?: string,
  ): Promise<LoginResult> {
    const response = await axiosInstance.post<{
      accessToken: string
      refreshToken: string
      user: UserInfo
    }>('/api/auth/register', { email, password, otpCode, displayName })

    const { accessToken, refreshToken, user } = response.data
    tokenStore.setAccessToken(accessToken)
    await tokenStore.setRefreshCookie(refreshToken)

    return { accessToken, refreshToken, user }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/token/logout', {
        method: 'POST',
        cache: 'no-store',
      })
    } catch {
      // best effort
    }
    tokenStore.clearAccessToken()
  },

  async refreshToken(): Promise<TokenPair> {
    const response = await fetch('/api/token/refresh', {
      method: 'POST',
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`Unable to refresh access token (${response.status})`)
    }
    const { accessToken } = (await response.json()) as TokenPair
    tokenStore.setAccessToken(accessToken)
    return { accessToken }
  },

  async exchangeOAuthSession(code: string): Promise<LoginResult> {
    const response = await axiosInstance.post<{
      accessToken: string
      refreshToken: string
    }>('/api/auth/oauth/session', { code })

    const { accessToken, refreshToken } = response.data
    tokenStore.setAccessToken(accessToken)
    await tokenStore.setRefreshCookie(refreshToken)

    return {
      accessToken,
      refreshToken,
      user: userFromAccessToken(accessToken),
    }
  },

  async forgotPasswordSendOtp(email: string): Promise<void> {
    await axiosInstance.post('/api/auth/forgot-password/send-otp', { email })
  },

  async forgotPasswordVerifyOtp(email: string, otpCode: string): Promise<void> {
    await axiosInstance.post('/api/auth/forgot-password/verify-otp', { email, otpCode })
  },

  async forgotPasswordReset(email: string, otpCode: string, newPassword: string): Promise<void> {
    await axiosInstance.post('/api/auth/forgot-password/reset', { email, otpCode, newPassword })
  },
}

export { axiosInstance }
