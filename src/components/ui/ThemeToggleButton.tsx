'use client'

import { useTheme } from '@/lib/theme/ThemeProvider'

export default function ThemeToggleButton() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors bg-white/60 dark:bg-[#1a1d27]/80 hover:bg-white dark:hover:bg-[#252836] border border-[#e0d8c8] dark:border-[#2e3142] text-[#7a7060] dark:text-gray-300 shadow-sm"
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
  )
}
