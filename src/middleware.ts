import { NextRequest, NextResponse } from 'next/server'
import { REFRESH_COOKIE_NAME } from '@/lib/auth/refreshCookie'

const PROTECTED_PATHS = ['/dashboard', '/lessons', '/profile', '/vocabulary', '/notes']
const LOGIN_PATH = '/login'

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
}

function getVocabularyRoute(pathname: string): string | null {
  const legacyPrefix = '/dashboard/vocabulary'
  if (pathname === legacyPrefix) return '/vocabulary/learn'
  if (!pathname.startsWith(legacyPrefix + '/')) return null

  const suffix = pathname.slice(legacyPrefix.length)
  if (suffix === '/review' || suffix.startsWith('/review/')) {
    return `/vocabulary${suffix}`
  }
  if (suffix === '/words' || suffix.startsWith('/words/')) {
    return `/vocabulary${suffix}`
  }
  return `/vocabulary/learn${suffix}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value
  const isAuthenticated = Boolean(refreshToken)

  // Authenticated users visiting / → redirect to /dashboard
  if (pathname === '/' && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl, 308)
  }

  // Legacy dashboard/* → short URL redirects (308 permanent)
  if (pathname === '/dashboard/learn' || pathname.startsWith('/dashboard/learn/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/learn${pathname.slice('/dashboard/learn'.length)}`
    return NextResponse.redirect(redirectUrl, 308)
  }

  if (pathname === '/dashboard/topics' || pathname.startsWith('/dashboard/topics/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/topics${pathname.slice('/dashboard/topics'.length)}`
    return NextResponse.redirect(redirectUrl, 308)
  }

  if (pathname === '/dashboard/notes' || pathname.startsWith('/dashboard/notes/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/notes${pathname.slice('/dashboard/notes'.length)}`
    return NextResponse.redirect(redirectUrl, 308)
  }

  const vocabularyRoute = getVocabularyRoute(pathname)
  if (vocabularyRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = vocabularyRoute
    return NextResponse.redirect(redirectUrl, 308)
  }

  // Unauthenticated user trying to access protected route
  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/lessons/:path*',
    '/profile/:path*',
    '/vocabulary/:path*',
    '/notes/:path*',
    '/topics/:path*',
    '/learn/:path*',
    '/login',
  ],
}
