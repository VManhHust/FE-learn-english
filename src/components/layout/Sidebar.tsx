'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { sidebarI18n } from '@/lib/i18n/topics'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 overflow-y-auto py-4 px-3 gap-1 bg-white dark:bg-[#1a1d27] border-r border-gray-200 dark:border-[#2e3142]">
      <div className="mb-2" />

      {sidebarI18n.navMain.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              active
                ? 'bg-blue-50 dark:bg-blue-950 text-[#3b4fd8] dark:text-blue-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-white text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#c8a84b', fontSize: 10 }}>
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}

      <p className="text-xs font-semibold px-3 mt-4 mb-1 uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {sidebarI18n.community}
      </p>

      {sidebarI18n.navCommunity.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              active
                ? 'bg-blue-50 dark:bg-blue-950 text-[#3b4fd8] dark:text-blue-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {item.label}
          </Link>
        )
      })}

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-[#2e3142]">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: '#8a7d55' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">{user?.displayName || user?.email}</p>
            <p className="text-xs truncate text-gray-400">{sidebarI18n.student}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
        >
          {sidebarI18n.logout}
        </button>
      </div>
    </aside>
  )
}
