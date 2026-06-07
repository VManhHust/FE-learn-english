'use client'

import Link from 'next/link'
import { ArrowLeft, Clock3, Construction } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { useLang } from '@/lib/i18n/LangProvider'

export default function NotFound() {
  const { lang } = useLang()
  const copy = lang === 'en'
    ? {
        badge: 'Under maintenance',
        title: 'This feature is being improved',
        description: 'Our team is working on this area to bring you a better learning experience. Please come back soon.',
        status: 'We will be back shortly',
        back: 'Back to lessons',
      }
    : {
        badge: 'Đang bảo trì',
        title: 'Tính năng đang được hoàn thiện',
        description: 'Đội ngũ LinguaFlow đang nâng cấp khu vực này để mang đến trải nghiệm học tập tốt hơn. Bạn vui lòng quay lại sau nhé.',
        status: 'Chúng tôi sẽ sớm quay trở lại',
        back: 'Quay lại bài học',
      }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f3ef] px-4 py-10 dark:bg-[#0f0e0c]">
      <div className="absolute left-0 top-0 size-72 -translate-x-1/3 -translate-y-1/3 rounded-full bg-[#d4a853]/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 size-96 translate-x-1/3 translate-y-1/3 rounded-full bg-[#d4a853]/10 blur-3xl" />

      <section className="relative w-full max-w-xl rounded-3xl border border-[#e8deca] bg-[#faf8f4]/95 p-7 text-center shadow-xl shadow-black/5 sm:p-10 dark:border-[#35302a] dark:bg-[#1a1917]/95">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-[#fff1cf] text-[#b7791f] ring-1 ring-[#e8c77f] dark:bg-[#342817] dark:text-[#edbd61] dark:ring-[#594526]">
          <Construction className="size-10" />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ead9b5] bg-[#fff8e8] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#9a6420] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62]">
          <span className="size-2 animate-pulse rounded-full bg-[#d4a853]" />
          {copy.badge}
        </div>

        <h1 className="text-3xl font-black tracking-tight text-[#1a1a2e] sm:text-4xl dark:text-gray-100">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#6b6256] sm:text-base dark:text-gray-400">
          {copy.description}
        </p>

        <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-xl bg-[#efe8dc] px-4 py-2 text-sm font-medium text-[#746858] dark:bg-[#25221e] dark:text-[#b8ad9d]">
          <Clock3 className="size-4 text-[#d4a853]" />
          {copy.status}
        </div>

        <Button
          asChild
          className="mt-8 h-11 rounded-xl bg-[#d4a853] px-6 font-bold text-white shadow-sm hover:bg-[#c29643]"
        >
          <Link href="/dashboard/topics">
            <ArrowLeft className="size-4" />
            {copy.back}
          </Link>
        </Button>
      </section>
    </main>
  )
}
