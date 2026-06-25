'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { useLang } from '@/lib/i18n/LangProvider'
import type { Lang } from '@/lib/i18n/LangProvider'
import { ChevronDown } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import { ProAction, StreakAction } from '@/components/layout/DashboardActions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANG_OPTIONS: { code: Lang; flag: string }[] = [
  { code: 'vi', flag: '🇻🇳' },
  { code: 'en', flag: '🇺🇸' },
]

export default function TopicsHeader() {
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, setLang, t } = useLang()
  const [langHover, setLangHover] = useState(false)
  const [themeHover, setThemeHover] = useState(false)

  const LANG_LABELS: Record<Lang, string> = {
    vi: t.header.langVi,
    en: t.header.langEn,
  }

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'
  const currentLang = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0]

  const defaultBorderColor = theme === 'dark' ? '#413927' : '#e2d8c7'
  const defaultBgColor = theme === 'dark' ? '#211e18' : '#ffffff'

  return (
    <header
      className="sticky top-0 z-40 flex h-14 w-full items-center justify-between gap-2 border-b border-[#e2d8c7] bg-gradient-to-r from-white/95 via-[#fbf8f2]/95 to-[#f7f1e6]/95 px-2 shadow-[0_8px_28px_rgba(69,52,23,0.09)] backdrop-blur-xl sm:px-5 dark:border-[#332d23] dark:from-[#15130f]/95 dark:via-[#11100e]/95 dark:to-[#19150e]/95 dark:shadow-[0_8px_28px_rgba(0,0,0,0.30)] lg:px-7"
          >
      {/* Logo */}
      <Link href="/dashboard" className="min-w-0 shrink">
        <Logo />
      </Link>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-[#e8dfd0] bg-white/65 p-1 shadow-sm sm:gap-1.5 dark:border-[#302c25] dark:bg-white/[0.035]">

        <div className="hidden sm:block"><ProAction /></div>

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              onMouseEnter={() => setLangHover(true)}
              onMouseLeave={() => setLangHover(false)}
              className="flex h-9 items-center gap-1 rounded-xl px-2 py-2 text-sm shadow-none transition-all duration-300 hover:shadow-sm sm:gap-1.5 sm:px-3"
              style={{
                backgroundColor: defaultBgColor,
                borderColor: langHover ? '#d4a853' : defaultBorderColor,
              }}
            >
              <span className="text-base">{currentLang.flag}</span>
              <span className="text-sm font-semibold hidden sm:block text-gray-700 dark:text-gray-300">
                {LANG_LABELS[lang]}
              </span>
              <ChevronDown size={12} className="text-gray-500 dark:text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 max-w-[calc(100vw-1rem)] rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a]"
          >
            {LANG_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.code}
                onClick={() => setLang(opt.code)}
                className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-[#ede4d0] dark:hover:bg-[#1a1a1a]"
              >
                <span>{opt.flag}</span>
                <span
                  className="text-gray-700 dark:text-gray-200"
                  style={{ color: lang === opt.code ? '#d4a853' : undefined, fontWeight: lang === opt.code ? 600 : 400 }}
                >
                  {LANG_LABELS[opt.code]}
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
          className="group flex h-9 items-center gap-1 rounded-xl px-2 py-2 text-sm shadow-none transition-all duration-300 hover:shadow-sm sm:gap-1.5 sm:px-3"
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
              <span className="text-sm font-semibold text-gray-300 group-hover:text-[#d4a853] transition-colors hidden sm:block">{t.header.light}</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#d4a853] transition-colors">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-[#d4a853] transition-colors hidden sm:block">{t.header.dark}</span>
            </>
          )}
        </Button>

        {/* Notification */}
        <div className="hidden sm:block"><DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl border border-transparent text-[#7a7060] hover:border-[#dfd1b8] hover:bg-white hover:text-[#b8832e] dark:text-gray-300 dark:hover:border-[#4a3d27] dark:hover:bg-[#252119]"
              aria-label="Notifications"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 max-w-[calc(100vw-1rem)] rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a] p-0"
          >
            <div className="px-4 py-3 border-b border-[#e5e3df] dark:border-[#1a1a1a]">
              <span className="text-sm font-semibold text-[#2c2c2c] dark:text-gray-100">{t.header.notifications}</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#7a7060] dark:text-gray-400">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="opacity-40">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {t.header.noNotifications}
            </div>
          </DropdownMenuContent>
        </DropdownMenu></div>

        <div className="hidden min-[380px]:block"><StreakAction /></div>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl border-2 border-white text-sm font-bold text-white shadow-md transition-transform hover:scale-105 dark:border-[#39332a]"
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
              <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs truncate text-gray-400">{user?.email}</p>
            </div>
            <DropdownMenuItem
              onClick={() => logout()}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-red-50 focus:bg-red-50 data-[highlighted]:bg-red-50 dark:hover:bg-[#2a2825] dark:focus:bg-[#2a2825] dark:data-[highlighted]:bg-[#2a2825] transition-colors text-red-500 focus:text-red-500"
            >
              {t.header.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
