export const REFRESH_COOKIE_NAME = 'linguaflow_user_refresh_token'

export function shouldUseSecureRefreshCookie(request: Request): boolean {
  const configured = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase()
  if (configured === 'true') return true
  if (configured === 'false') return false

  const forwardedProtocol = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    .trim()

  return forwardedProtocol
    ? forwardedProtocol === 'https'
    : new URL(request.url).protocol === 'https:'
}
