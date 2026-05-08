'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { useTheme } from '@/lib/theme/ThemeProvider'

const LANG_OPTIONS = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export default function TopicsHeader() {
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const [lang, setLang] = useState('vi')
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const langMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'
  const currentLang = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0]

  return (
    <header className="sticky top-0 z-40 w-full border-b flex items-center justify-between px-4 h-14 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#1a1a1a]">
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

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: theme === 'dark' ? '#0a0a0a' : '#faf8f3',
              borderColor: theme === 'dark' ? '#2a2a2a' : '#e0d8c8',
            }}
          >
            <span className="text-base">{currentLang.flag}</span>
            <span className="text-xs font-semibold hidden sm:block text-gray-700 dark:text-gray-300">{currentLang.label}</span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="text-gray-500 dark:text-gray-400">
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-10 w-40 rounded-xl shadow-lg py-1 z-50 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a]">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => { setLang(opt.code); setLangOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  style={{ color: lang === opt.code ? '#c8a84b' : undefined, fontWeight: lang === opt.code ? 600 : 400 }}
                >
                  <span>{opt.flag}</span>
                  <span className="text-gray-700 dark:text-gray-200">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: theme === 'dark' ? '#0a0a0a' : '#faf8f3',
            borderColor: theme === 'dark' ? '#2a2a2a' : '#e0d8c8',
          }}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#c8a84b] transition-colors">
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
              <span className="text-xs font-semibold text-gray-300 group-hover:text-[#c8a84b] transition-colors hidden sm:block">Sáng</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#c8a84b] transition-colors">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700 group-hover:text-[#c8a84b] transition-colors hidden sm:block">Tối</span>
            </>
          )}
        </button>

        {/* Notification */}
        <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-500 dark:text-gray-400">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: '#8a7d55' }}
          >
            {initials}
          </button>
          {userOpen && (
            <div className="absolute right-0 top-10 w-48 rounded-xl shadow-lg py-1 z-50 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a]">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a]">
                <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">{user?.displayName || user?.email}</p>
                <p className="text-xs truncate text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); setUserOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-red-500"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
