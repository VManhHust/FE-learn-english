import axios, { AxiosRequestConfig } from 'axios'
import { tokenStore } from './tokenStore'
import type { UserInfo } from './types'

export interface LoginResult {
  accessToken: string
  user: UserInfo
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
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

// --- Response interceptor: handle 401 with refresh + queue ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const isRefreshEndpoint = originalRequest.url?.includes('/api/auth/refresh')

    if (is401 && !isRefreshEndpoint && !originalRequest._retry) {
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
        await tokenStore.clearRefreshCookie()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
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

    return { accessToken, user }
  },

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/api/auth/logout')
    } catch {
      // best effort
    }
    tokenStore.clearAccessToken()
    await tokenStore.clearRefreshCookie()
  },

  async refreshToken(): Promise<TokenPair> {
    const response = await axiosInstance.post<TokenPair>('/api/auth/refresh')
    const { accessToken, refreshToken } = response.data
    tokenStore.setAccessToken(accessToken)
    await tokenStore.setRefreshCookie(refreshToken)
    return { accessToken, refreshToken }
  },
}

export { axiosInstance }
