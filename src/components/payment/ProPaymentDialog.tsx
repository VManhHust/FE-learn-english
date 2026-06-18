'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Check,
  Clock3,
  Copy,
  Crown,
  GraduationCap,
  Loader2,
  MessageCircle,
  Quote,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { paymentApi, type PaymentOrder, type ProPlanCode } from '@/lib/api/payments'
import { useLang } from '@/lib/i18n/LangProvider'

type DialogStep = 'benefits' | 'checkout'

const POLL_INTERVAL_MS = 3000

const PRO_PLANS: Array<{
  code: ProPlanCode
  months: number | null
  price: number
  discount?: number
  featured?: boolean
}> = [
  { code: 'MONTHLY', months: 1, price: 69_000 },
  { code: 'QUARTERLY', months: 3, price: 169_000, discount: 18 },
  { code: 'YEARLY', months: 12, price: 499_000, discount: 40, featured: true },
  { code: 'LIFETIME', months: null, price: 1_849_000, discount: 30 },
]

function formatMoney(amount: number, currency: string, lang: string) {
  return new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string | undefined, lang: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getRemainingTime(expiresAt: string | undefined) {
  if (!expiresAt) return ''
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

interface ProPaymentDialogProps {
  controlledOpen?: boolean
  onControlledOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export default function ProPaymentDialog({
  controlledOpen,
  onControlledOpenChange,
  hideTrigger = false,
}: ProPaymentDialogProps = {}) {
  const { lang, t } = useLang()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<DialogStep>('benefits')
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [remainingTime, setRemainingTime] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [proExpiresAt, setProExpiresAt] = useState<string>()
  const [selectedPlan, setSelectedPlan] = useState<ProPlanCode>('YEARLY')
  const dialogOpen = controlledOpen ?? open

  const copy = t.payment

  useEffect(() => {
    paymentApi.getProStatus()
      .then((status) => {
        setIsPro(status.pro)
        setProExpiresAt(status.proExpiresAt)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!dialogOpen || !order?.expiresAt || order.status !== 'PENDING') return
    const update = () => setRemainingTime(getRemainingTime(order.expiresAt))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [dialogOpen, order?.expiresAt, order?.status])

  useEffect(() => {
    if (!dialogOpen || !order || order.status !== 'PENDING') return

    let active = true
    const poll = async () => {
      try {
        const latestOrder = await paymentApi.getOrder(order.orderId)
        if (!active) return
        setOrder(latestOrder)
        setError('')
        if (latestOrder.status === 'PAID') {
          setIsPro(true)
          setProExpiresAt(latestOrder.proExpiresAt)
          window.dispatchEvent(new CustomEvent('pro-status-changed', { detail: { pro: true } }))
        }
      } catch {
        if (active) setError(copy.pollingError)
      }
    }

    const interval = window.setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [copy.pollingError, dialogOpen, order?.orderId, order?.status])

  const createOrder = useCallback(async () => {
    setCreating(true)
    setError('')
    try {
      const newOrder = await paymentApi.createProOrder(selectedPlan)
      setOrder(newOrder)
      setStep('checkout')
    } catch {
      setError(copy.createError)
    } finally {
      setCreating(false)
    }
  }, [copy.createError, selectedPlan])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    onControlledOpenChange?.(nextOpen)
    if (!nextOpen) {
      setStep('benefits')
      setCopied(false)
      setError('')
    }
  }

  const handleCopy = async () => {
    if (!order?.paymentCode) return
    await navigator.clipboard.writeText(order.paymentCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const amount = useMemo(
    () => order ? formatMoney(order.amount, order.currency, lang) : '',
    [lang, order],
  )

  const selectedPlanInfo = PRO_PLANS.find((plan) => plan.code === selectedPlan) ?? PRO_PLANS[2]

  const planLabel = (planCode: ProPlanCode) => {
    const labels: Record<ProPlanCode, string> = {
      MONTHLY: copy.plans.monthly,
      QUARTERLY: copy.plans.quarterly,
      YEARLY: copy.plans.yearly,
      LIFETIME: copy.plans.lifetime,
    }
    return labels[planCode]
  }

  const planDescription = (planCode: ProPlanCode) => {
    if (planCode === 'LIFETIME') {
      return copy.lifetimePayment
    }
    return `${copy.onePayment} ${planLabel(planCode)}`
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="h-9 gap-1.5 rounded-lg bg-gradient-to-r from-[#b8872f] to-[#d4a853] px-3 font-bold text-white shadow-sm hover:from-[#a97927] hover:to-[#c29643]">
            <Crown className="size-4 fill-white/20" />
            <span>{isPro ? copy.active : 'PRO'}</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        className={`max-h-[92vh] border-[#e3d1a9] bg-[#faf8f4] p-0 dark:border-[#54462c] dark:bg-[#1a1917] ${
          step === 'checkout' ? 'sm:max-w-4xl' : 'sm:max-w-5xl'
        } ${step === 'benefits' ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {step === 'benefits' ? (
          <div className="min-h-[620px]">
            <div className="border-b border-[#eadcc2] bg-gradient-to-br from-[#fffaf0] via-[#fff7e8] to-[#f4e7cf] px-6 pb-6 pt-7 text-center dark:border-[#3e3528] dark:from-[#211d17] dark:via-[#1c1915] dark:to-[#2a2116]">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c8973a] to-[#e8b84b] text-white shadow-[0_8px_22px_rgba(212,168,83,0.35)]">
                <Crown className="size-6 fill-white/15" />
              </div>
              <DialogHeader className="items-center">
                <DialogTitle className="font-display text-3xl font-black tracking-tight text-[#2c2416] dark:text-[#f5ead7]">
                  <span>Lingua</span><span className="text-[#d4a853]">Flow</span> Premium
                </DialogTitle>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ead7ad] bg-white/70 px-3 py-1 text-xs font-semibold text-[#665c4e] dark:border-[#4a3d29] dark:bg-white/5 dark:text-[#d8cdbd]">
                    <Users className="size-3.5 text-[#b8872f]" />
                    {copy.community}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ead7ad] bg-white/70 px-3 py-1 text-xs font-semibold text-[#665c4e] dark:border-[#4a3d29] dark:bg-white/5 dark:text-[#d8cdbd]">
                    <GraduationCap className="size-3.5 text-[#b8872f]" />
                    {copy.learningPath}
                  </span>
                </div>
                <DialogDescription className="pt-1 text-sm font-medium text-[#655d51] dark:text-[#c9bdac]">
                  {copy.tagline}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid md:grid-cols-[0.95fr_1.05fr]">
              <section className="border-b border-[#e7ddce] p-6 md:border-b-0 md:border-r dark:border-[#35302a]">
                <div className="space-y-3">
                  {PRO_PLANS.map((plan) => {
                    const selected = selectedPlan === plan.code
                    const monthlyPrice = plan.months ? Math.round(plan.price / plan.months) : null

                    return (
                      <button
                        key={plan.code}
                        type="button"
                        onClick={() => setSelectedPlan(plan.code)}
                        className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
                          selected
                            ? 'border-[#d4a853] bg-gradient-to-br from-white to-[#fff8e8] shadow-[0_10px_25px_rgba(120,88,35,0.10)] dark:from-[#22201c] dark:to-[#2b2418]'
                            : 'border-[#ded7cc] bg-white/60 hover:border-[#d4a853]/70 dark:border-[#39342d] dark:bg-white/[0.025]'
                        }`}
                      >
                        {plan.featured && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#d4a853] px-3 py-1 text-[9px] font-black tracking-wide text-white shadow-md">
                            <Sparkles className="mr-1 inline size-3" />
                            {copy.bestChoice}
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected ? 'border-[#d4a853] bg-[#d4a853] text-white' : 'border-[#b9b3aa]'
                            }`}>
                              {selected && <Check className="size-3 stroke-[3]" />}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-[#29261f] dark:text-white">{planLabel(plan.code)}</p>
                                {plan.discount && (
                                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    -{plan.discount}%
                                  </span>
                                )}
                              </div>
                              {monthlyPrice && (
                                <p className="mt-1 text-xs text-[#746c60] dark:text-gray-400">
                                  ~ {formatMoney(monthlyPrice, 'VND', lang)}
                                  {copy.perMonth}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className={`${plan.featured ? 'text-2xl' : 'text-xl'} whitespace-nowrap font-black tracking-tight text-[#1a1a2e] dark:text-white`}>
                            {formatMoney(plan.price, 'VND', lang)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {isPro ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900/70 dark:bg-emerald-950/30">
                    <BadgeCheck className="mx-auto mb-2 size-7 text-emerald-600" />
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">{copy.active}</p>
                    {proExpiresAt && (
                      <p className="mt-1 text-xs text-emerald-700/75 dark:text-emerald-400">
                        {copy.validUntil} {formatDate(proExpiresAt, lang)}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={createOrder}
                    disabled={creating}
                    className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-[#b8872f] to-[#d4a853] text-base font-black text-white shadow-[0_12px_28px_rgba(212,168,83,0.28)] hover:from-[#a97927] hover:to-[#c29643]"
                  >
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4 fill-white/15" />}
                    {copy.unlock} - {formatMoney(selectedPlanInfo.price, 'VND', lang)}
                  </Button>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#72695b] dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    {copy.securePayment}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="size-3.5 fill-[#d4a853] text-[#d4a853]" />
                    {copy.instantActivation}
                  </span>
                </div>
                {error && <p className="mt-3 text-center text-xs font-medium text-red-500">{error}</p>}
              </section>

              <section className="flex flex-col p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-[#fff0c7] text-[#b8872f] dark:bg-[#3a2a14] dark:text-[#f2bd62]">
                    <Sparkles className="size-4" />
                  </span>
                  <h3 className="text-base font-black text-[#b1781e] dark:text-[#e4b45d]">
                    {copy.premiumBenefits}
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {[
                    t.header.proListening,
                    t.header.proSpeaking,
                    t.header.proInsights,
                    copy.unlimitedNotes,
                    copy.progressAndStreak,
                    copy.priorityAccess,
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d4a853] text-white">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                      <span className="text-sm leading-relaxed text-[#585044] dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="relative mt-7 rounded-2xl border border-[#ead7ad] bg-[#fffdf8] p-4 pl-5 dark:border-[#493d2a] dark:bg-white/[0.03]">
                  <Quote className="absolute -top-3 left-4 size-7 fill-[#d4a853] text-[#d4a853]" />
                  <p className="pt-2 text-sm italic leading-relaxed text-[#625a4e] dark:text-gray-300">
                    {copy.testimonial}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-0.5 text-[#e4ad32]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="size-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-[#817768] dark:text-gray-400">
                      {copy.testimonialAuthor}
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-center gap-2 pt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#9b8e7b]">
                  <BookOpenCheck className="size-4 text-[#b8872f]" />
                  {copy.learningExperience}
                </div>
              </section>
            </div>
          </div>
        ) : order && (
          <div className="grid md:grid-cols-[0.88fr_1.12fr]">
            <section className="flex flex-col border-b border-[#e6ddce] bg-[#f4efe6] p-4 md:border-b-0 md:border-r md:p-5 dark:border-[#35302a] dark:bg-[#141311]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-[#d4a853] text-white shadow-sm">
                  <Crown className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a87828]">LinguaFlow PRO</p>
                  <h2 className="text-xl font-black text-[#1a1a2e] dark:text-white">{copy.summary}</h2>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e4d8c4] bg-white/70 p-3.5 dark:border-[#35302a] dark:bg-white/[0.03]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#29261f] dark:text-gray-100">
                      LinguaFlow {planLabel(order.planCode)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#756d61] dark:text-gray-400">
                      {planDescription(order.planCode)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff0c7] px-2.5 py-1 text-xs font-bold text-[#9a6420] dark:bg-[#3a2a14] dark:text-[#f2bd62]">PRO</span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between text-[#6f685d] dark:text-gray-400">
                  <span>{copy.subtotal}</span><span>{amount}</span>
                </div>
                <div className="flex justify-between text-[#6f685d] dark:text-gray-400">
                  <span>{copy.tax}</span><span>{formatMoney(0, order.currency, lang)}</span>
                </div>
                <div className="h-px bg-[#ddd1bd] dark:bg-[#35302a]" />
                <div className="flex items-end justify-between">
                  <span className="font-bold text-[#29261f] dark:text-white">{copy.total}</span>
                  <span className="text-2xl font-black text-[#1a1a2e] dark:text-white">{amount}</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3 rounded-2xl bg-[#ebe2d3] p-3.5 dark:bg-[#24211c]">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#a87828]" />
                <p className="text-xs leading-relaxed text-[#696155] dark:text-gray-400">{copy.security}</p>
              </div>

              <div className="mt-auto rounded-2xl border border-[#d7c7a9] bg-[#fffaf0] p-3.5 dark:border-[#40372a] dark:bg-[#1f1c17]">
                <p className="text-xs leading-relaxed text-[#8a6426] dark:text-[#e4b45d]">
                  {copy.supportNote}
                </p>
                <Button
                  asChild
                  className="mt-3 h-9 w-full rounded-xl bg-[#1a1a2e] font-bold text-white shadow-none hover:bg-[#303047] dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#c29f4f]"
                >
                  <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" />
                    {copy.supportCta}
                  </a>
                </Button>
              </div>
            </section>

            <section className="flex flex-col items-center justify-center p-4 text-center md:p-5">
              {order.status === 'PAID' ? (
                <div className="mx-auto max-w-sm">
                  <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                    <BadgeCheck className="size-11 text-emerald-600" />
                  </div>
                  <DialogHeader className="items-center">
                    <DialogTitle className="text-2xl font-black text-[#1a1a2e] dark:text-white">{copy.success}</DialogTitle>
                    <DialogDescription>{copy.successDescription}</DialogDescription>
                  </DialogHeader>
                  {order.proExpiresAt && (
                    <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {copy.validUntil} {formatDate(order.proExpiresAt, lang)}
                    </p>
                  )}
                  <Button onClick={() => handleOpenChange(false)} className="mt-5 h-11 w-full bg-[#d4a853] font-bold text-white hover:bg-[#c29643]">
                    {copy.close}
                  </Button>
                </div>
              ) : order.status === 'EXPIRED' ? (
                <div className="mx-auto max-w-sm">
                  <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-[#eee6d9] dark:bg-[#29251f]">
                    <Clock3 className="size-10 text-[#9a8060]" />
                  </div>
                  <DialogTitle className="text-xl font-black text-[#1a1a2e] dark:text-white">{copy.expired}</DialogTitle>
                  <Button onClick={createOrder} disabled={creating} className="mt-5 h-11 bg-[#d4a853] font-bold text-white hover:bg-[#c29643]">
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    {copy.retry}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2 text-[#1a1a2e] dark:text-white">
                    <Building2 className="size-5 text-[#a87828]" />
                    <h2 className="text-lg font-black">{copy.bankTransfer}</h2>
                  </div>
                  <p className="mb-4 max-w-md text-sm leading-relaxed text-[#746c60] dark:text-gray-400">{copy.instruction}</p>

                  <div className="rounded-3xl border border-[#e2d6c2] bg-white p-2.5 shadow-[0_18px_45px_rgba(54,44,28,0.08)] dark:border-[#3a342b] dark:bg-white">
                    <img src={order.qrCodeUrl} alt={copy.qrAlt} className="size-52 max-w-full object-contain md:size-56" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#4b453b] dark:text-gray-200">
                    {order.bank} <span className="font-normal text-[#81786a]">- {order.accountNumber}</span>
                  </p>
                  {order.accountHolder && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#918777]">{order.accountHolder}</p>
                  )}
                  <p className="mt-2 text-2xl font-black text-[#1a1a2e] dark:text-white">{amount}</p>

                  <div className="mt-3">
                    <p className="mb-1.5 text-xs text-[#81786a] dark:text-gray-400">{copy.transferContent}</p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#f0eadf] px-4 py-2 font-mono text-sm font-bold text-[#29261f] transition-colors hover:bg-[#e6dccb] dark:bg-[#29251f] dark:text-[#f2bd62] dark:hover:bg-[#332d25]"
                    >
                      {order.paymentCode}
                      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-[#6f685d] dark:text-gray-400">
                    <Loader2 className="size-4 animate-spin text-[#d4a853]" />
                    <span>{copy.waiting}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#9a9183]">
                    {copy.expires}: <span className="font-semibold tabular-nums">{remainingTime || '00:00'}</span>
                  </p>
                  {error && <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">{error}</p>}
                </>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
