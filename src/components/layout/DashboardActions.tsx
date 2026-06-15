'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, CircleCheck, Flame, Loader2 } from 'lucide-react'
import { streakApi, type StreakResponse } from '@/lib/api/streak'
import { useLang } from '@/lib/i18n/LangProvider'
import { Button } from '@/components/ui/button'
import ProPaymentDialog from '@/components/payment/ProPaymentDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function toLocalDayKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StreakAction() {
  const { lang, t } = useLang()
  const [streak, setStreak] = useState<StreakResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    streakApi.getStatus()
      .then((status) => {
        if (active) setStreak(status)
      })
      .catch(() => {
        if (active) setError(t.header.streakLoadError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [t.header.streakLoadError])

  const week = useMemo(() => {
    const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
    const today = new Date(`${streak?.today ?? toLocalDayKey(new Date())}T00:00:00`)
    const mondayOffset = (today.getDay() + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - mondayOffset)
    const checkedDates = new Set(streak?.checkedInDates ?? [])

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const key = toLocalDayKey(date)
      return {
        key,
        label: new Intl.DateTimeFormat(locale, { weekday: 'short' })
          .format(date)
          .replace('.', '')
          .toUpperCase(),
        active: checkedDates.has(key),
        today: key === streak?.today,
      }
    })
  }, [lang, streak])

  async function handleCheckIn() {
    if (checkingIn || streak?.checkedInToday) return

    setCheckingIn(true)
    setError('')
    try {
      setStreak(await streakApi.checkIn())
    } catch {
      setError(t.header.streakCheckInError)
    } finally {
      setCheckingIn(false)
    }
  }

  const currentStreak = streak?.currentStreak ?? 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-1.5 rounded-lg border-[#ead9b5] bg-[#fff8e8] px-2.5 text-[#9a6420] hover:border-[#d4a853] hover:bg-[#fff1cf] hover:text-[#7c4b12] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62] dark:hover:bg-[#35291a]"
          aria-label={`${t.header.streak}: ${currentStreak} ${t.header.days}`}
        >
          <Flame className="size-4 fill-[#f59e0b] text-[#e88716]" />
          <span className="font-bold tabular-nums">{currentStreak}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-[#eadfcb] bg-[#faf8f4] p-5 sm:max-w-sm dark:border-[#35302a] dark:bg-[#1a1917]">
        <DialogHeader className="items-center text-center">
          <div className="relative flex size-14 items-center justify-center">
            <Flame className="size-14 fill-[#f59e0b] text-[#e88716]" />
            <span className="absolute mt-2 size-4 rounded-full bg-[#ffd36a]" />
          </div>
          <DialogTitle className="text-4xl font-black leading-none text-[#1a1a2e] dark:text-white">
            {loading ? '...' : currentStreak}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium uppercase text-[#687086]">
            {currentStreak === 1 ? t.header.oneDay : t.header.dayCount}
          </DialogDescription>
          <p className="pt-2 text-sm font-bold text-[#252a3e] dark:text-gray-100">
            {t.header.yourStreak}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-7 gap-2 pt-1">
          {week.map((day) => (
            <div key={day.key} className="flex min-w-0 flex-col items-center gap-2">
              <span className={`text-[11px] font-semibold ${day.today ? 'text-[#9a6420] dark:text-[#f2bd62]' : 'text-[#8b8173]'}`}>
                {day.label}
              </span>
              <div
                className={`flex size-7 items-center justify-center rounded-full ${
                  day.active
                    ? 'bg-[#d4a853] text-white'
                    : day.today
                      ? 'bg-[#fff0c7] ring-2 ring-[#d4a853] dark:bg-[#3a2a14]'
                      : 'bg-[#f3ede2] dark:bg-[#2b2822]'
                }`}
              >
                {day.active && <Check className="size-4 stroke-[3]" />}
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-[#eadfcb] dark:bg-[#35302a]" />

        <Button
          onClick={handleCheckIn}
          disabled={loading || checkingIn || Boolean(streak?.checkedInToday)}
          className={`h-11 w-full rounded-2xl font-bold uppercase ${
            streak?.checkedInToday
              ? 'bg-[#d4a853] text-white opacity-100 disabled:opacity-70'
              : 'bg-[#d4a853] text-white hover:bg-[#c29643]'
          }`}
        >
          {checkingIn ? (
            <Loader2 className="size-4 animate-spin" />
          ) : streak?.checkedInToday ? (
            <CircleCheck className="size-4" />
          ) : (
            <Flame className="size-4" />
          )}
          {streak?.checkedInToday ? t.header.checkedIn : t.header.checkIn}
        </Button>

        {error && (
          <p className="text-center text-xs font-medium text-red-500">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ProAction() {
  return <ProPaymentDialog />
}

export default function DashboardActions() {
  return (
    <div className="flex items-center gap-2">
      <StreakAction />
      <ProAction />
    </div>
  )
}
