'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

const LANG_OPTIONS = [
  { code: 'vi', label: 'Ti\u1ebfng Vi\u1ec7t', flag: '\ud83c\uddfb\ud83c\uddf3' },
  { code: 'en', label: 'English', flag: '\ud83c\uddfa\ud83c\uddf8' },
]

export default function TopicsHeader() {
  const { user, logout } = useAuth()
  const [lang, setLang] = useState('vi')
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'
  const currentLang = LANG_OPTIONS.find((l) => l.code === lang) ?? LANG_OPTIONS[0]

  return (
    <header
      className="sticky top-0 z-40 w-full border-b flex items-center justify-between px-4 h-14"
      style={{ backgroundColor: '#fff', borderColor: '#e5e7eb' }}
    >
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
        {/* Facebook Community */}
        <button
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50"
          style={{ color: '#1877f2', border: '1px solid #e5e7eb' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook Community
        </button>

        {/* Theme toggle */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{ color: '#6b7280' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </button>

        {/* Language */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-gray-100"
            style={{ color: '#374151' }}
          >
            <span>{currentLang.flag}</span>
            <span className="hidden sm:block text-xs">{currentLang.label}</span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {langOpen && (
            <div
              className="absolute right-0 top-10 w-36 rounded-xl shadow-lg py-1 z-50 bg-white"
              style={{ border: '1px solid #e5e7eb' }}
            >
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => { setLang(opt.code); setLangOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                  style={{ color: lang === opt.code ? '#3b4fd8' : '#374151', fontWeight: lang === opt.code ? 600 : 400 }}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{ color: '#6b7280' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* PRO badge */}
        <button
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
        >
          👑 PRO
        </button>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: '#8a7d55' }}
          >
            {initials}
          </button>
          {userOpen && (
            <div
              className="absolute right-0 top-10 w-48 rounded-xl shadow-lg py-1 z-50 bg-white"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div className="px-4 py-2 border-b" style={{ borderColor: '#e5e7eb' }}>
                <p className="text-xs font-medium truncate" style={{ color: '#1a1a2e' }}>{user?.displayName || user?.email}</p>
                <p className="text-xs truncate" style={{ color: '#9ca3af' }}>{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); setUserOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition-colors"
                style={{ color: '#ef4444' }}
              >
                {'\u0110\u0103ng xu\u1ea5t'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
