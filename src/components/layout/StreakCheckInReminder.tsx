'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Check, Flame, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { streakApi, type StreakResponse } from '@/lib/api/streak'
import { useLang } from '@/lib/i18n/LangProvider'

function toLocalDayKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function reminderKey(day: string) {
  return `linguaflow-streak-reminder-${day}`
}

export default function StreakCheckInReminder() {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<StreakResponse | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState('')

  const copy = lang === 'vi'
    ? {
        title: 'Điểm danh hôm nay',
        description: 'Giữ nhịp học mỗi ngày. Bạn cũng sẽ được tự động điểm danh khi hoàn thành một bài tập bất kỳ.',
        current: 'Chuỗi hiện tại',
        days: 'ngày',
        checkIn: 'Điểm danh ngay',
        later: 'Để sau',
        checked: 'Đã điểm danh',
        error: 'Điểm danh chưa thành công. Vui lòng thử lại.',
      }
    : {
        title: 'Daily check-in',
        description: 'Keep your learning rhythm. You will also be checked in automatically after completing any exercise.',
        current: 'Current streak',
        days: 'days',
        checkIn: 'Check in now',
        later: 'Later',
        checked: 'Checked in',
        error: 'Check-in failed. Please try again.',
      }

  useEffect(() => {
    let active = true

    streakApi.getStatus()
      .then((nextStatus) => {
        if (!active) return
        setStatus(nextStatus)
        const today = nextStatus.today ?? toLocalDayKey(new Date())
        if (!nextStatus.checkedInToday && localStorage.getItem(reminderKey(today)) !== 'dismissed') {
          setOpen(true)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const today = status?.today ?? toLocalDayKey(new Date())
  const currentStreak = status?.currentStreak ?? 0
  const week = useMemo(() => {
    const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
    const date = new Date(`${today}T00:00:00`)
    const mondayOffset = (date.getDay() + 6) % 7
    const monday = new Date(date)
    monday.setDate(date.getDate() - mondayOffset)
    const checkedDates = new Set(status?.checkedInDates ?? [])

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + index)
      const key = toLocalDayKey(day)
      return {
        key,
        active: checkedDates.has(key) || key === today && Boolean(status?.checkedInToday),
        today: key === today,
        label: new Intl.DateTimeFormat(locale, { weekday: 'short' })
          .format(day)
          .replace('.', '')
          .toUpperCase(),
      }
    })
  }, [lang, status, today])

  function closeForToday() {
    localStorage.setItem(reminderKey(today), 'dismissed')
    setOpen(false)
  }

  async function handleCheckIn() {
    if (checkingIn || status?.checkedInToday) return
    setCheckingIn(true)
    setError('')
    try {
      const nextStatus = await streakApi.checkIn()
      setStatus(nextStatus)
      localStorage.setItem(reminderKey(nextStatus.today ?? today), 'dismissed')
      window.dispatchEvent(new CustomEvent('streak:updated', { detail: nextStatus }))
      setOpen(false)
    } catch {
      setError(copy.error)
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) closeForToday()
      else setOpen(true)
    }}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-[#eadfcb] bg-[#faf8f4] p-0 shadow-[0_24px_80px_rgba(69,52,23,0.22)] sm:max-w-md dark:border-[#35302a] dark:bg-[#1a1917] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="relative border-b border-[#eadfcb] bg-gradient-to-br from-[#fff7e3] via-[#fffdf8] to-[#f3e4bd] px-6 py-6 text-center dark:border-[#35302a] dark:from-[#2a2115] dark:via-[#1a1917] dark:to-[#302412]">
          <button
            type="button"
            onClick={closeForToday}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-[#7a7060] transition hover:bg-white/70 hover:text-[#9a6420] dark:text-[#b8b2a6] dark:hover:bg-white/10 dark:hover:text-[#f2bd62]"
            aria-label={copy.later}
          >
            <X className="size-4" />
          </button>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#d4a853] text-white shadow-[0_12px_30px_rgba(212,168,83,0.35)] dark:text-[#171614]">
            <Flame className="size-9 fill-[#f59e0b] text-white dark:text-[#171614]" />
          </div>
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl font-black tracking-tight text-[#1a1a2e] dark:text-[#eee8dc]">
              {copy.title}
            </DialogTitle>
            <DialogDescription className="max-w-sm text-sm leading-6 text-[#6f665a] dark:text-[#b8b2a6]">
              {copy.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-[#eadfcb] bg-white/70 p-4 text-center dark:border-[#35302a] dark:bg-black/15">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9a6420] dark:text-[#f2bd62]">
              {copy.current}
            </p>
            <p className="mt-2 text-4xl font-black text-[#1a1a2e] dark:text-[#eee8dc]">
              {currentStreak}
              <span className="ml-2 text-sm font-bold text-[#7a7060] dark:text-[#9f998c]">{copy.days}</span>
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {week.map((day) => (
              <div key={day.key} className="flex min-w-0 flex-col items-center gap-2">
                <span className={`text-[10px] font-bold ${day.today ? 'text-[#9a6420] dark:text-[#f2bd62]' : 'text-[#8b8173]'}`}>
                  {day.label}
                </span>
                <div
                  className={`flex size-8 items-center justify-center rounded-full border ${
                    day.active
                      ? 'border-[#d4a853] bg-[#d4a853] text-white dark:text-[#171614]'
                      : day.today
                        ? 'border-[#d4a853] bg-[#fff0c7] text-[#9a6420] dark:bg-[#3a2a14] dark:text-[#f2bd62]'
                        : 'border-[#eadfcb] bg-[#f3ede2] text-[#b8afa1] dark:border-[#35302a] dark:bg-[#2b2822]'
                  }`}
                >
                  {day.active ? <Check className="size-4 stroke-[3]" /> : <CalendarCheck className="size-3.5" />}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={closeForToday}
              className="h-11 rounded-xl border-[#eadfcb] bg-white font-bold text-[#7a7060] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6420] dark:border-[#35302a] dark:bg-black/15 dark:text-[#b8b2a6] dark:hover:bg-[#2a2115] dark:hover:text-[#f2bd62]"
            >
              {copy.later}
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={checkingIn || Boolean(status?.checkedInToday)}
              className="h-11 rounded-xl bg-[#d4a853] font-black text-white hover:bg-[#c29643] disabled:opacity-80 dark:text-[#171614]"
            >
              {checkingIn ? <Loader2 className="size-4 animate-spin" /> : <Flame className="size-4" />}
              {status?.checkedInToday ? copy.checked : copy.checkIn}
            </Button>
          </div>

          {error && <p className="text-center text-xs font-semibold text-red-500">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
