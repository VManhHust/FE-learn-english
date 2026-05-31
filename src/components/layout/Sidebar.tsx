'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { sidebarI18n } from '@/lib/i18n/topics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const ACTIVE_CLASS = 'bg-[#f5f3ef] dark:bg-[#1a1917] text-[#d4a853] font-semibold border border-[#d4a853]'
const INACTIVE_CLASS = 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1917]'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 overflow-y-auto py-4 px-3 gap-1 bg-[#f5f3ef] dark:bg-[#0f0e0c] border-r border-[#e5e3df] dark:border-[#2e2c29]">
      <div className="mb-2" />

      {sidebarI18n.navMain.map((item) => {
        const isLessonDetail = pathname.startsWith('/dashboard/learn/')
        const isTopicsItem = item.href === '/dashboard/topics'
        const active = pathname.startsWith(item.href) || (isLessonDetail && isTopicsItem)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}
          >
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge
                className="text-white px-1.5 py-0 rounded-full text-[10px] leading-5"
                style={{ backgroundColor: '#d4a853' }}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        )
      })}

      {sidebarI18n.navCommunity.length > 0 && (
        <>
          <p className="text-xs font-semibold px-3 mt-4 mb-1 uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {sidebarI18n.community}
          </p>

          {sidebarI18n.navCommunity.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}
              >
                {item.label}
              </Link>
            )
          })}
        </>
      )}

      <div className="mt-auto pt-4">
        <Separator className="mb-4 bg-[#e5e3df] dark:bg-[#2e2c29]" />

        {/* User info */}
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: '#8a7d55' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
              {user?.displayName || user?.email}
            </p>
            <p className="text-xs truncate text-gray-400">{sidebarI18n.student}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={() => logout()}
          className="w-full justify-start px-3 py-1.5 text-xs rounded-lg h-auto hover:bg-red-50 dark:hover:bg-red-950 text-red-500 hover:text-red-500"
        >
          {sidebarI18n.logout}
        </Button>
      </div>
    </aside>
  )
}
