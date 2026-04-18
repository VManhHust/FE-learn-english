export interface UserInfo {
  id: number
  email: string
  displayName: string
  role: 'USER' | 'ADMIN'
}

export interface AccessTokenClaims {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
}
