'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { sidebarI18n } from '@/lib/i18n/topics'
import { sidebarI18n_en } from '@/lib/i18n/topics_en'
import { useLang } from '@/lib/i18n/LangProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  BookOpen,
  ChevronRight,
  Headphones,
  LogOut,
  NotebookPen,
} from 'lucide-react'

const NAV_ICONS = {
  '/dashboard/topics': Headphones,
  '/dashboard/vocabulary': BookOpen,
  '/dashboard/notes': NotebookPen,
} as const

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { lang } = useLang()
  const sidebar = lang === 'en' ? sidebarI18n_en : sidebarI18n
  const initials = user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside className="relative hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-[#ddd5c7] bg-gradient-to-b from-[#fbfaf7] via-[#f7f4ed] to-[#f1ece2] px-4 py-5 shadow-[8px_0_24px_rgba(72,58,31,0.06)] md:flex dark:border-[#34312d] dark:from-[#171614] dark:via-[#131210] dark:to-[#0f0e0c]">
      <div className="pointer-events-none absolute -left-20 top-16 size-48 rounded-full bg-[#d4a853]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 size-48 rounded-full bg-[#b8832e]/10 blur-3xl" />

      <nav className="relative min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {sidebar.navMain.map((item) => {
          const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS]
          const isLessonDetail = pathname.startsWith('/dashboard/learn/')
          const isTopicsItem = item.href === '/dashboard/topics'
          const isCurrentSection = pathname === item.href || pathname.startsWith(item.href + '/')
          const active = isCurrentSection || (isLessonDetail && isTopicsItem)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={'group relative flex min-h-11 items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-1.5 text-sm transition-all duration-200 ' + (
                active
                  ? 'border-[#dfbd78] bg-white text-[#9a6b18] shadow-[0_6px_18px_rgba(92,67,23,0.10)] dark:border-[#8e6c30] dark:bg-[#211d16] dark:text-[#e0b85e]'
                  : 'border-transparent text-[#4b5563] hover:translate-x-0.5 hover:border-[#e7dfd1] hover:bg-white/80 hover:text-[#9a6b18] hover:shadow-sm dark:text-[#b8b2a6] dark:hover:border-[#34312d] dark:hover:bg-white/[0.045] dark:hover:text-[#d4b05a]'
              )}
            >
              {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-gradient-to-b from-[#e2bb69] to-[#b8832e]" />}

              <span className={'flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ' + (
                active
                  ? 'bg-gradient-to-br from-[#e2bb69] to-[#b8832e] text-white shadow-[0_5px_12px_rgba(184,131,46,0.22)]'
                  : 'border border-[#e7dfd1] bg-white/80 text-[#657084] group-hover:border-[#dfbd78] group-hover:text-[#b8832e] dark:border-[#3b3833] dark:bg-[#1d1b18] dark:text-[#aaa397]'
              )}>
                {Icon && <Icon className="size-4" strokeWidth={1.9} />}
              </span>

              <span className={'min-w-0 flex-1 truncate ' + (active ? 'font-bold' : 'font-medium')}>{item.label}</span>

              {item.badge ? (
                <Badge className="rounded-full bg-[#d4a853] px-1.5 py-0 text-[10px] leading-5 text-white hover:bg-[#d4a853]">
                  {item.badge}
                </Badge>
              ) : (
                <ChevronRight className={'size-4 transition-all ' + (
                  active
                    ? 'translate-x-0 opacity-100 text-[#b8832e]'
                    : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                )} />
              )}
            </Link>
          )
        })}

        {sidebar.navCommunity.length > 0 && (
          <div className="pt-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f998c]">
              {sidebar.community}
            </p>
            {sidebar.navCommunity.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ' + (
                    active
                      ? 'bg-white text-[#9a6b18] shadow-sm dark:bg-[#211d16] dark:text-[#d4b05a]'
                      : 'text-[#657084] hover:bg-white/70 hover:text-[#9a6b18] dark:text-[#aaa397] dark:hover:bg-white/[0.04]'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      <div className="relative mt-5 shrink-0 rounded-2xl border border-[#dfd6c6] bg-white/80 p-2.5 shadow-[0_8px_24px_rgba(72,58,31,0.08)] backdrop-blur-sm dark:border-[#34312d] dark:bg-white/[0.04]">
        <div className="flex items-center gap-3 rounded-xl px-1.5 py-1.5">
          <Avatar className="size-10 border-2 border-white shadow-sm dark:border-[#34312d]">
            <AvatarFallback className="bg-gradient-to-br from-[#9f905f] to-[#74683f] text-sm font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#29261f] dark:text-[#eee8dc]">
              {user?.displayName || user?.email}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#8f887c]">{sidebar.student}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => logout()}
          className="mt-2 h-9 w-full justify-start gap-2 rounded-xl px-3 text-xs font-semibold text-[#a84c43] hover:bg-[#fff0ed] hover:text-[#a84c43] dark:text-[#e08478] dark:hover:bg-[#3a1d1a]"
        >
          <LogOut className="size-3.5" />
          {sidebar.logout}
        </Button>
      </div>
    </aside>
  )
}
