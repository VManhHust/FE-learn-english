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
    const response = await fetch('/api/token/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`Unable to store refresh token (${response.status})`)
    }
  },

  async clearRefreshCookie(): Promise<void> {
    const response = await fetch('/api/token/clear-cookie', {
      method: 'POST',
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`Unable to clear refresh token (${response.status})`)
    }
  },
}
