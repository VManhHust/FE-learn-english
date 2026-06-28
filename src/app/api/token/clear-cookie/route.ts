import { NextResponse } from 'next/server'

const REFRESH_COOKIE_NAME = 'linguaflow_refresh_token'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(REFRESH_COOKIE_NAME)
  return response
}
