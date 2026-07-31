'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Inbox, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLang } from '@/lib/i18n/LangProvider'
import {
  notificationsApi,
  type LearningNotification,
} from '@/lib/api/notifications'
import {
  LEARNING_ACTIVITY_UPDATED_EVENT,
  LEARNING_COMPLETED_EVENT,
} from '@/lib/streakEvents'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import NotificationItem from '@/components/notifications/NotificationItem'

export const NOTIFICATIONS_REFRESH_EVENT = 'notifications:refresh'
const PREVIEW_LIMIT = 8

export default function NotificationBell() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useLang()
  const n = t.header.notification
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<LearningNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return
    if (showLoading) setLoading(true)
    try {
      const response = await notificationsApi.getNotifications({ limit: PREVIEW_LIMIT })
      setItems(response.items)
      setUnreadCount(response.unreadCount)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    void loadNotifications(true)
    const interval = window.setInterval(() => void loadNotifications(), 60_000)

    const refresh = () => void loadNotifications()
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refreshOnFocus)
    window.addEventListener(LEARNING_COMPLETED_EVENT, refresh)
    window.addEventListener(LEARNING_ACTIVITY_UPDATED_EVENT, refresh)
    window.addEventListener('streak:updated', refresh)
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, refresh)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refreshOnFocus)
      window.removeEventListener(LEARNING_COMPLETED_EVENT, refresh)
      window.removeEventListener(LEARNING_ACTIVITY_UPDATED_EVENT, refresh)
      window.removeEventListener('streak:updated', refresh)
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, refresh)
    }
  }, [authLoading, isAuthenticated, loadNotifications])

  useEffect(() => {
    if (open) void loadNotifications()
  }, [loadNotifications, open])

  async function handleActivate(notification: LearningNotification) {
    if (notification.unread) {
      try {
        const updated = await notificationsApi.markAsRead(notification.id)
        setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch {
        // Navigation remains available if updating read state temporarily fails.
      }
    }

    setOpen(false)
    if (notification.type === 'STREAK_REMINDER') {
      window.dispatchEvent(new Event('streak:open'))
      return
    }
    if (notification.actionUrl) router.push(notification.actionUrl)
  }

  async function handleMarkAllRead() {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await notificationsApi.markAllAsRead()
      const now = new Date().toISOString()
      setItems((current) => current.map((item) => ({
        ...item,
        unread: false,
        readAt: item.readAt ?? now,
      })))
      setUnreadCount(0)
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT))
    } finally {
      setMarkingAll(false)
    }
  }

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-xl border border-transparent text-[#7a7060] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#dfd1b8] hover:bg-white hover:text-[#b8832e] active:translate-y-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#d4a853]/45 motion-reduce:transform-none motion-reduce:transition-none dark:text-gray-300 dark:hover:border-[#4a3d27] dark:hover:bg-[#252119]"
          aria-label={`${t.header.notifications}${unreadCount ? ` (${unreadCount})` : ''}`}
        >
          <Bell className="size-[18px]" strokeWidth={1.9} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#f8f5ef] bg-[#d58a2c] px-1 text-[9px] font-black leading-none text-white shadow-sm dark:border-[#1c1914]">
              {badgeText}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-1rem)] max-w-[390px] overflow-hidden rounded-2xl border border-[#e6dccb] bg-[#fbf9f5] p-0 shadow-[0_22px_60px_rgba(54,40,18,0.20)] dark:border-[#373128] dark:bg-[#191816] dark:shadow-[0_22px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e8dfd0] bg-white/80 px-4 py-3.5 dark:border-[#302c25] dark:bg-white/[0.025]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#fff1cf] text-[#b87919] dark:bg-[#3a2a14] dark:text-[#f2bd62]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#252a3e] dark:text-[#f5f1e9]">
                  {t.header.notifications}
                </p>
                <p className="text-[10px] text-[#8e887d] dark:text-[#8f897e]">
                  {unreadCount > 0
                    ? (n.unreadSummary.replace('{count}', String(unreadCount)))
                    : n.allRead}
                </p>
              </div>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.preventDefault()
                void handleMarkAllRead()
              }}
              disabled={markingAll}
              className="h-8 shrink-0 rounded-lg px-2 text-[10px] font-bold text-[#9a6b18] hover:bg-[#fff1cf] hover:text-[#7c4b12] dark:text-[#e2b35e] dark:hover:bg-[#3a2a14]"
            >
              {markingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              <span className="hidden min-[360px]:inline">{n.markAllRead}</span>
            </Button>
          )}
        </div>

        <div className="max-h-[min(31rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-3 px-2 py-3">
                  <Skeleton className="size-10 shrink-0 rounded-xl bg-[#eee5d6] dark:bg-[#2c2923]" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Skeleton className="h-3 w-3/4 bg-[#eee5d6] dark:bg-[#2c2923]" />
                    <Skeleton className="h-2.5 w-full bg-[#f2eadf] dark:bg-[#292620]" />
                    <Skeleton className="h-2.5 w-1/3 bg-[#f2eadf] dark:bg-[#292620]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#f3ede3] text-[#8c8170] dark:bg-[#292620]">
                <RefreshCw className="size-5" />
              </span>
              <p className="text-sm font-bold text-[#34384a] dark:text-[#eee9df]">{n.loadErrorTitle}</p>
              <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-[#7f8290] dark:text-[#989286]">{n.loadErrorDescription}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.preventDefault()
                  void loadNotifications(true)
                }}
                className="mt-4 rounded-xl border-[#dfcfb2] bg-white text-[#93631c] hover:bg-[#fff5df] dark:border-[#4a3d29] dark:bg-[#24211c]"
              >
                <RefreshCw className="size-3.5" />
                {n.tryAgain}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#f3ede3] text-[#a0927c] dark:bg-[#292620] dark:text-[#8d8374]">
                <Inbox className="size-6" />
                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#fbf9f5] bg-[#6ba47f] dark:border-[#191816]" />
              </span>
              <p className="text-sm font-bold text-[#34384a] dark:text-[#eee9df]">{n.emptyTitle}</p>
              <p className="mt-1 max-w-[250px] text-xs leading-relaxed text-[#7f8290] dark:text-[#989286]">{n.emptyDescription}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#eee5d8] dark:divide-[#302c25]">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onActivate={(item) => void handleActivate(item)}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {!loading && !error && items.length > 0 && (
          <div className="border-t border-[#e8dfd0] bg-white/65 p-2 dark:border-[#302c25] dark:bg-white/[0.02]">
            <Button
              variant="ghost"
              className="h-9 w-full rounded-xl text-xs font-bold text-[#90611e] hover:bg-[#fff1cf] hover:text-[#774b12] dark:text-[#e2b35e] dark:hover:bg-[#3a2a14]"
              onClick={() => {
                setOpen(false)
                router.push('/dashboard/notifications')
              }}
            >
              {n.viewAll}
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
