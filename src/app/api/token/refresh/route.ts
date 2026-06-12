import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const REFRESH_COOKIE_NAME = 'linguaflow_refresh_token'
const BACKEND_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

  if (!refreshToken) {
    return NextResponse.json({ message: 'Refresh token is missing' }, { status: 401 })
  }

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
      },
      cache: 'no-store',
    })

    if (!backendResponse.ok) {
      const response = NextResponse.json(
        { message: 'Refresh token is invalid or expired' },
        { status: backendResponse.status },
      )
      if (backendResponse.status === 401) {
        response.cookies.delete(REFRESH_COOKIE_NAME)
      }
      return response
    }

    const tokenPair = (await backendResponse.json()) as {
      accessToken: string
      refreshToken: string
    }
    const response = NextResponse.json({ accessToken: tokenPair.accessToken })
    response.cookies.set(REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch {
    return NextResponse.json(
      { message: 'Authentication service is unavailable' },
      { status: 502 },
    )
  }
}
