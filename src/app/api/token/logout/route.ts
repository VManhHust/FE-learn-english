import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { REFRESH_COOKIE_NAME } from '@/lib/auth/refreshCookie'
const BACKEND_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
        },
        cache: 'no-store',
      })
    } catch {
      // Local logout should still succeed when the backend is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(REFRESH_COOKIE_NAME)
  return response
}
