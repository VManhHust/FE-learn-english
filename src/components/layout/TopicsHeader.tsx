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
  const [notifOpen, setNotifOpen] = useState(false)

  const langMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
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
    <header className="sticky top-0 z-40 w-full border-b flex items-center justify-between px-4 h-14 bg-[#f5f3ef] dark:bg-[#0f0e0c] border-[#e5e3df] dark:border-[#2e2c29] shadow-md" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
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

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 hover:border-[#d4a853] h-10"
            style={{
              backgroundColor: theme === 'dark' ? '#1a1917' : '#f5f3ef',
              borderColor: theme === 'dark' ? '#2e2c29' : '#e5e3df',
            }}
          >
            <span className="text-base">{currentLang.flag}</span>
            <span className="text-sm font-semibold hidden sm:block text-gray-700 dark:text-gray-300">{currentLang.label}</span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="text-gray-500 dark:text-gray-400">
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-10 w-40 rounded-xl shadow-lg py-1 z-50 bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a]">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => { setLang(opt.code); setLangOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  <span>{opt.flag}</span>
                  <span 
                    className="text-gray-700 dark:text-gray-200"
                    style={{ color: lang === opt.code ? '#d4a853' : undefined, fontWeight: lang === opt.code ? 600 : 400 }}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="group flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 hover:border-[#d4a853] h-10"
          style={{
            backgroundColor: theme === 'dark' ? '#1a1917' : '#f5f3ef',
            borderColor: theme === 'dark' ? '#2e2c29' : '#e5e3df',
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
        </button>

        {/* Notification */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#ede4d0] dark:hover:bg-[#252836] text-[#7a7060] dark:text-gray-300"
            aria-label="Notifications"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-72 rounded-xl shadow-lg z-50 bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a]">
              <div className="px-4 py-3 border-b border-[#e5e3df] dark:border-[#1a1a1a] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#2c2c2c] dark:text-gray-100">Thông báo</span>
              </div>
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#7a7060] dark:text-gray-400">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} className="opacity-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs">Không có thông báo nào</p>
              </div>
            </div>
          )}
        </div>

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
            <div className="absolute right-0 top-10 w-48 rounded-xl shadow-lg py-1 z-50 bg-[#f5f3ef] dark:bg-[#1a1917] border border-[#e5e3df] dark:border-[#1a1a1a]">
              <div className="px-4 py-2 border-b border-[#e5e3df] dark:border-[#1a1a1a]">
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
