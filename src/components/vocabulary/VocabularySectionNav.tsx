'use client'

import { BookOpen, List, RotateCcw } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function VocabularySectionNav({ lang }: { lang: 'vi' | 'en' }) {
  const pathname = usePathname()
  const router = useRouter()
  const items = [
    { href: '/dashboard/vocabulary', icon: BookOpen, vi: 'Học từ', en: 'Learn' },
    { href: '/dashboard/vocabulary/review', icon: RotateCcw, vi: 'Ôn tập', en: 'Review' },
    { href: '/dashboard/vocabulary/words', icon: List, vi: 'Danh sách từ', en: 'Word list' },
  ]

  return (
    <nav className="sticky top-0 z-30 mb-4 rounded-xl border border-[#ded8cc] bg-white/90 p-1 shadow-[0_3px_12px_rgba(72,58,31,0.06)] backdrop-blur-xl md:hidden dark:border-[#34312d] dark:bg-[#171614]/90">
      <div className="grid grid-cols-3 items-center gap-1">
        {items.map(({ href, icon: Icon, vi, en }) => {
          const active = href === '/dashboard/vocabulary'
            ? pathname === href
            : pathname.startsWith(href)
          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className={cn(
                'flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-semibold transition-all duration-200 sm:h-9 sm:px-4 sm:text-[13px]',
                active
                  ? 'border-[#d4a853]/55 bg-gradient-to-r from-[#fff7e4] to-[#fff0ca] text-[#9a6b18] shadow-[0_1px_4px_rgba(180,127,29,0.12)] dark:border-[#d4b05a]/45 dark:from-[#2a2115] dark:to-[#241d14] dark:text-[#d4b05a]'
                  : 'text-[#6b7280] hover:bg-[#f5f0e8] hover:text-[#9a6b18] dark:text-[#aaa497] dark:hover:bg-[#25231f] dark:hover:text-[#d4b05a]',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{lang === 'vi' ? vi : en}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
