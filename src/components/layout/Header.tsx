'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { useTheme } from '@/lib/theme/ThemeProvider'
import vi from '@/lib/i18n/vi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [lang, setLang] = useState('vi')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langHover, setLangHover] = useState(false)
  const [themeHover, setThemeHover] = useState(false)

  const initials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  const currentLang = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0]
  const { theme, toggle: toggleTheme } = useTheme()

  const defaultBorderColor = theme === 'dark' ? '#2e2c29' : '#e5e3df'
  const defaultBgColor = theme === 'dark' ? '#1a1917' : '#f5f3ef'

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f5f3ef] dark:bg-[#0f0e0c] border-b border-[#e5e3df] dark:border-[#2e2c29]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#d4a853' }}
          >
            L
          </div>
          <span className="font-display font-semibold text-lg hidden sm:block" style={{ color: '#d4a853' }}>
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
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#ede4d0] dark:bg-[#1a1a1a] text-[#2c2c2c] dark:text-gray-100 font-bold'
                    : 'bg-transparent text-[#7a7060] dark:text-gray-300 font-medium hover:text-[#4a4030] dark:hover:text-gray-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <Badge
                    className="text-white rounded-full font-medium px-1.5 py-0 text-[10px] leading-5"
                    style={{ backgroundColor: '#d4a853' }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                onMouseEnter={() => setLangHover(true)}
                onMouseLeave={() => setLangHover(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg h-9 text-sm transition-all duration-300"
                style={{
                  backgroundColor: defaultBgColor,
                  borderColor: langHover ? '#d4a853' : defaultBorderColor,
                }}
              >
                <span className="text-base">{currentLang.flag}</span>
                <span className="text-sm font-semibold hidden sm:block text-gray-700 dark:text-gray-300">
                  {currentLang.label}
                </span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="text-gray-500 dark:text-gray-400">
                  <path d="M6 8L1 3h10z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a]"
            >
              {LANG_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.code}
                  onClick={() => setLang(opt.code)}
                  className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-[#ede4d0] dark:hover:bg-[#1a1a1a]"
                >
                  <span>{opt.flag}</span>
                  <span
                    className="text-[#4a4030] dark:text-gray-200"
                    style={{ color: lang === opt.code ? '#d4a853' : undefined, fontWeight: lang === opt.code ? 600 : 400 }}
                  >
                    {opt.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark mode toggle */}
          <Button
            variant="outline"
            onClick={toggleTheme}
            onMouseEnter={() => setThemeHover(true)}
            onMouseLeave={() => setThemeHover(false)}
            className="group flex items-center gap-1.5 px-3 py-2 rounded-lg h-9 text-sm transition-all duration-300"
            style={{
              backgroundColor: defaultBgColor,
              borderColor: themeHover ? '#d4a853' : defaultBorderColor,
            }}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#d4a853] transition-colors">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span className="text-sm font-semibold text-gray-300 group-hover:text-[#d4a853] transition-colors hidden sm:block">Sáng</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#d4a853] transition-colors">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#d4a853] transition-colors hidden sm:block">Tối</span>
              </>
            )}
          </Button>

          {/* Notification */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full hover:bg-[#ede4d0] dark:hover:bg-[#252836] text-[#7a7060] dark:text-gray-300"
                aria-label="Notifications"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a] p-0"
            >
              <div className="px-4 py-3 border-b border-[#e5e3df] dark:border-[#1a1a1a]">
                <span className="text-sm font-semibold text-[#2c2c2c] dark:text-gray-100">Thông báo</span>
              </div>
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#7a7060] dark:text-gray-400">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="opacity-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs">Không có thông báo nào</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: '#8a7d55' }}
              >
                {initials}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a] p-0"
            >
              <div className="px-4 py-2">
                <p className="text-xs font-medium truncate text-[#2c2c2c] dark:text-gray-100">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs truncate text-[#7a7060] dark:text-gray-400">{user?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm cursor-pointer hover:bg-[#ede4d0] focus:bg-[#ede4d0] data-[highlighted]:bg-[#ede4d0] dark:hover:bg-[#2a2825] dark:focus:bg-[#2a2825] dark:data-[highlighted]:bg-[#2a2825] transition-colors text-[#4a4030] dark:text-gray-200 focus:text-[#4a4030] dark:focus:text-gray-200"
                >
                  {vi.header.profile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => logout()}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#ede4d0] focus:bg-[#ede4d0] data-[highlighted]:bg-[#ede4d0] dark:hover:bg-[#2a2825] dark:focus:bg-[#2a2825] dark:data-[highlighted]:bg-[#2a2825] transition-colors text-red-500 focus:text-red-500"
              >
                {vi.header.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden w-8 h-8 text-[#7a7060] dark:text-gray-300"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 border-[#e5e3df] dark:border-[#1a1a1a] bg-[#f5f3ef] dark:bg-[#0f0e0c]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#4a4030] dark:text-gray-200"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
              {item.badge && (
                <Badge
                  className="text-white rounded-full font-medium px-1.5 py-0 text-[10px] leading-5"
                  style={{ backgroundColor: '#d4a853' }}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
