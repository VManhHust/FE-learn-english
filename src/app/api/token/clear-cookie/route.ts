import { NextResponse } from 'next/server'
import { REFRESH_COOKIE_NAME } from '@/lib/auth/refreshCookie'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(REFRESH_COOKIE_NAME)
  return response
}
