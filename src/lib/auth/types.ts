export interface UserInfo {
  id: number
  email: string
  displayName: string
  role: 'USER' | 'ADMIN'
  status?: 'ACTIVE' | 'LOCK' | 'DELETE'
}

export interface AccessTokenClaims {
  sub: string
  email: string
  role: string
  displayName: string
  status?: 'ACTIVE' | 'LOCK' | 'DELETE'
  iat: number
  exp: number
}
