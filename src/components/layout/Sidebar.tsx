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
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 overflow-y-auto py-4 px-3 gap-1"
      style={{ backgroundColor: '#fff', borderRight: '1px solid #e5e7eb' }}
    >
      <div className="mb-2" />

      {sidebarI18n.navMain.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: active ? '#eff6ff' : 'transparent',
              color: active ? '#3b4fd8' : '#374151',
              fontWeight: active ? 600 : 400,
            }}
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

      <p className="text-xs font-semibold px-3 mt-4 mb-1 uppercase tracking-wider" style={{ color: '#9ca3af' }}>
        {sidebarI18n.community}
      </p>

      {sidebarI18n.navCommunity.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: active ? '#eff6ff' : 'transparent',
              color: active ? '#3b4fd8' : '#374151',
              fontWeight: active ? 600 : 400,
            }}
          >
            {item.label}
          </Link>
        )
      })}

      <div className="mt-4 px-2">
        <button
          className="w-full py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#3b4fd8' }}
        >
          {sidebarI18n.upgrade}
        </button>
      </div>

      <div className="mt-auto pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: '#8a7d55' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#1a1a2e' }}>{user?.displayName || user?.email}</p>
            <p className="text-xs truncate" style={{ color: '#9ca3af' }}>{sidebarI18n.student}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-50"
          style={{ color: '#ef4444' }}
        >
          {sidebarI18n.logout}
        </button>
      </div>
    </aside>
  )
}
