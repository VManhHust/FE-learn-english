'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BellRing, CheckCheck, Inbox, Loader2, RefreshCw } from 'lucide-react'
import TopicsHeader from '@/components/layout/TopicsHeader'
import NotificationItem from '@/components/notifications/NotificationItem'
import { NOTIFICATIONS_REFRESH_EVENT } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLang } from '@/lib/i18n/LangProvider'
import {
  notificationsApi,
  type LearningNotification,
} from '@/lib/api/notifications'

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const router = useRouter()
  const { t } = useLang()
  const n = t.header.notification
  const [items, setItems] = useState<LearningNotification[]>([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async (reset = true) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const offset = reset ? 0 : loadedCount
      const response = await notificationsApi.getNotifications({
        offset,
        limit: PAGE_SIZE,
        unreadOnly,
        includeExpired: true,
      })
      setItems((current) => reset ? response.items : [...current, ...response.items])
      setLoadedCount((current) => reset ? response.items.length : current + response.items.length)
      setUnreadCount(response.unreadCount)
      setHasMore(response.hasMore)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [loadedCount, unreadOnly])

  useEffect(() => {
    void load(true)
    // `load` changes as the list grows; filtering is the only state that should reload page one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly])

  async function handleActivate(notification: LearningNotification) {
    if (notification.unread) {
      try {
        const updated = await notificationsApi.markAsRead(notification.id)
        if (unreadOnly) {
          setItems((current) => current.filter((item) => item.id !== notification.id))
        } else {
          setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
        }
        setUnreadCount((count) => Math.max(0, count - 1))
        window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT))
      } catch {
        // The destination should remain reachable during a temporary API failure.
      }
    }

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
      setUnreadCount(0)
      setItems((current) => unreadOnly
        ? []
        : current.map((item) => item.unread
          ? { ...item, unread: false, readAt: item.readAt ?? now }
          : item))
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT))
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#20253a] dark:bg-[#11100e] dark:text-gray-100">
      <TopicsHeader />

      <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mb-4 -ml-2 rounded-xl text-xs font-semibold text-[#777164] hover:bg-[#ede5d8] hover:text-[#8e601d] dark:text-[#aaa397] dark:hover:bg-[#27241f]"
        >
          <ArrowLeft className="size-4" />
          {n.backToDashboard}
        </Button>

        <section className="relative overflow-hidden rounded-3xl border border-[#e4d8c5] bg-gradient-to-br from-white via-[#fffcf6] to-[#f7ecd7] px-5 py-6 shadow-[0_18px_50px_rgba(76,55,20,0.08)] sm:px-8 sm:py-8 dark:border-[#373027] dark:from-[#201e1a] dark:via-[#1b1916] dark:to-[#292116]">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[#e7bd69]/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-[#8ab29a]/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d6a340] to-[#b97d24] text-white shadow-[0_8px_22px_rgba(185,125,36,0.28)] sm:size-14">
                <BellRing className="size-6 sm:size-7" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-[#17203a] sm:text-3xl dark:text-white">
                    {n.pageTitle}
                  </h1>
                  {unreadCount > 0 && (
                    <Badge className="border-0 bg-[#d58a2c] px-2.5 font-bold text-white hover:bg-[#d58a2c]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#697185] sm:text-sm dark:text-[#aaa397]">
                  {n.pageSubtitle}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => void handleMarkAllRead()}
                disabled={markingAll}
                className="h-10 self-start rounded-xl border-[#dfc48d] bg-white/85 px-3 text-xs font-bold text-[#91601c] shadow-sm hover:border-[#d4a853] hover:bg-[#fff3d8] dark:border-[#5b4829] dark:bg-[#28231b] dark:text-[#e5b760] dark:hover:bg-[#33291b] sm:self-auto"
              >
                {markingAll ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
                {n.markAllRead}
              </Button>
            )}
          </div>
        </section>

        <section className="mt-5 sm:mt-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-[#e3d9c9] bg-white p-1 shadow-sm dark:border-[#342f27] dark:bg-[#1d1b18]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUnreadOnly(false)}
                className={`h-8 rounded-lg px-3 text-xs font-bold ${
                  !unreadOnly
                    ? 'bg-[#fff0cf] text-[#94611a] shadow-sm hover:bg-[#fff0cf] dark:bg-[#3a2a14] dark:text-[#efbd62]'
                    : 'text-[#777164] hover:bg-[#f4eee4] dark:text-[#9d978d] dark:hover:bg-[#292620]'
                }`}
              >
                {n.allTab}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUnreadOnly(true)}
                className={`h-8 rounded-lg px-3 text-xs font-bold ${
                  unreadOnly
                    ? 'bg-[#fff0cf] text-[#94611a] shadow-sm hover:bg-[#fff0cf] dark:bg-[#3a2a14] dark:text-[#efbd62]'
                    : 'text-[#777164] hover:bg-[#f4eee4] dark:text-[#9d978d] dark:hover:bg-[#292620]'
                }`}
              >
                {n.unreadTab}
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#d58a2c] px-1.5 py-0.5 text-[9px] leading-none text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex gap-4 rounded-2xl border border-[#e7ddcd] bg-white p-4 sm:p-5 dark:border-[#332e27] dark:bg-[#211f1b]">
                  <Skeleton className="size-11 shrink-0 rounded-xl bg-[#eee5d6] dark:bg-[#2e2a24] sm:size-12" />
                  <div className="flex-1 space-y-2.5 pt-1">
                    <Skeleton className="h-3.5 w-1/2 bg-[#eee5d6] dark:bg-[#2e2a24]" />
                    <Skeleton className="h-3 w-5/6 bg-[#f2eadf] dark:bg-[#292620]" />
                    <Skeleton className="h-2.5 w-1/4 bg-[#f2eadf] dark:bg-[#292620]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-dashed border-[#decfb7] bg-white/65 px-5 py-14 text-center dark:border-[#463b2c] dark:bg-[#1d1b18]">
              <RefreshCw className="mx-auto size-7 text-[#a38d6a]" />
              <h2 className="mt-3 text-base font-bold">{n.loadErrorTitle}</h2>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#777d8d] dark:text-[#9e988d]">{n.loadErrorDescription}</p>
              <Button
                variant="outline"
                onClick={() => void load(true)}
                className="mt-5 rounded-xl border-[#ddc79e] bg-white text-[#93631c] hover:bg-[#fff5df] dark:border-[#514128] dark:bg-[#24211c]"
              >
                <RefreshCw className="size-4" />
                {n.tryAgain}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#decfb7] bg-white/65 px-5 py-14 text-center dark:border-[#463b2c] dark:bg-[#1d1b18]">
              <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#efe9de] text-[#9c8d76] dark:bg-[#292620] dark:text-[#887e70]">
                <Inbox className="size-7" />
              </span>
              <h2 className="mt-4 text-base font-bold text-[#30364a] dark:text-[#eee9df]">{n.emptyTitle}</h2>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#777d8d] dark:text-[#9e988d]">{n.emptyDescription}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onActivate={(item) => void handleActivate(item)}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => void load(false)}
                    disabled={loadingMore}
                    className="h-10 rounded-xl border-[#ddcaa7] bg-white px-5 text-xs font-bold text-[#93631c] hover:bg-[#fff5df] dark:border-[#514128] dark:bg-[#24211c] dark:text-[#e2b35e]"
                  >
                    {loadingMore && <Loader2 className="size-4 animate-spin" />}
                    {loadingMore ? n.loadingMore : n.loadMore}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
