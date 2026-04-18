const ACCESS_TOKEN_KEY = 'linguaflow_access_token'

export const tokenStore = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  clearAccessToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },

  async setRefreshCookie(token: string): Promise<void> {
    await fetch('/api/token/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },

  async clearRefreshCookie(): Promise<void> {
    await fetch('/api/token/clear-cookie', {
      method: 'POST',
    })
  },
}
