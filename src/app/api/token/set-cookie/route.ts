import { NextResponse } from 'next/server'

const REFRESH_COOKIE_NAME = 'linguaflow_refresh_token'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string
    refreshToken?: string
  }
  const refreshToken = body.refreshToken ?? body.token

  if (!refreshToken) {
    return NextResponse.json({ message: 'Refresh token is required' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
