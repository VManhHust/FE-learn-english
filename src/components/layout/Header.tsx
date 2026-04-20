'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { useTheme } from '@/lib/theme/ThemeProvider'

import vi from '@/lib/i18n/vi'

const NAV_ITEMS = [
  { label: vi.nav.home, href: '/dashboard/topics' },
  { label: vi.nav.vocabulary, href: '/dashboard/vocabulary' },
  { label: vi.nav.speaking, href: '/dashboard/speaking' },
  { label: vi.nav.toeic, href: '/dashboard/toeic', badge: vi.nav.new },
]

const LANG_OPTIONS = [
  { code: 'vi', label: vi.header.langVi, flag: '🇻🇳' },
  { code: 'en', label: vi.header.langEn, flag: '🇺🇸' },
]

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [lang, setLang] = useState('vi')
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  const currentLang = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0]
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <header
      className="sticky top-0 z-40 w-full border-b bg-[#faf8f3] dark:bg-[#1a1d27] border-[#e0d8c8] dark:border-[#2e3142]"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#c8a84b' }}
          >
            L
          </div>
          <span className="font-display font-semibold text-lg hidden sm:block" style={{ color: '#c8a84b' }}>
            LinguaFlow
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/dashboard/topics'
              ? pathname.startsWith('/dashboard/topics')
              : pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                style={{
                  color: active ? '#2c2c2c' : '#7a7060',
                  backgroundColor: active ? '#ede4d0' : 'transparent',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
                {item.badge && (
                  <span
                    className="text-white rounded-full font-medium"
                    style={{ backgroundColor: '#c8a84b', fontSize: '10px', padding: '1px 6px' }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Upgrade PRO */}
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#c8a84b' }}
          >
            <span style={{ fontSize: 13 }}>&#9733;</span>
            {vi.header.upgrade}
          </button>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => { setLangMenuOpen(!langMenuOpen); setUserMenuOpen(false) }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-cream-dark"
              style={{ color: '#4a4030' }}
            >
              <span>{currentLang.flag}</span>
              <span className="hidden sm:block">{currentLang.label}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10z" />
              </svg>
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-10 w-40 rounded-xl shadow-lg py-1 z-50 bg-[#faf8f3] dark:bg-[#1a1d27] border border-[#e0d8c8] dark:border-[#2e3142]">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => { setLang(opt.code); setLangMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#ede4d0] dark:hover:bg-[#252836] transition-colors"
                    style={{ color: lang === opt.code ? '#c8a84b' : undefined, fontWeight: lang === opt.code ? 600 : 400 }}
                  >
                    <span>{opt.flag}</span>
                    <span className="text-[#4a4030] dark:text-gray-200">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#ede4d0] dark:hover:bg-[#252836] text-[#7a7060] dark:text-gray-300"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="5"/>
                <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Notification */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-cream-dark"
            style={{ color: '#7a7060' }}
            aria-label="Notifications"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* User avatar */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setLangMenuOpen(false) }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
              style={{ backgroundColor: '#8a7d55' }}
            >
              {initials}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-48 rounded-xl shadow-lg py-1 z-50 bg-[#faf8f3] dark:bg-[#1a1d27] border border-[#e0d8c8] dark:border-[#2e3142]">
                <div className="px-4 py-2 border-b border-[#e0d8c8] dark:border-[#2e3142]">
                  <p className="text-xs font-medium truncate text-[#2c2c2c] dark:text-gray-100">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs truncate text-[#7a7060] dark:text-gray-400">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm hover:bg-[#ede4d0] dark:hover:bg-[#252836] transition-colors text-[#4a4030] dark:text-gray-200"
                  onClick={() => setUserMenuOpen(false)}
                >
                  {vi.header.profile}
                </Link>
                <button
                  onClick={() => { logout(); setUserMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#ede4d0] dark:hover:bg-[#252836] transition-colors text-red-500"
                >
                  {vi.header.logout}
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center"
            style={{ color: '#7a7060' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 border-[#e0d8c8] dark:border-[#2e3142] bg-[#faf8f3] dark:bg-[#1a1d27]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#4a4030] dark:text-gray-200"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
              {item.badge && (
                <span className="text-white rounded-full font-medium" style={{ backgroundColor: '#c8a84b', fontSize: '10px', padding: '1px 6px' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
