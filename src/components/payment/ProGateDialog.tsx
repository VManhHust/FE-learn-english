'use client'

import { Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLang } from '@/lib/i18n/LangProvider'

interface ProGateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlock: () => void
}

export default function ProGateDialog({ open, onOpenChange, onUnlock }: ProGateDialogProps) {
  const { t } = useLang()
  const copy = t.payment
  const benefits = [
    copy.gateUnlimitedLessons,
    copy.gateAllDecks,
    copy.gateVocabularyLimit,
    copy.gateNoAds,
    copy.gatePrioritySupport,
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-[#e3d1a9] bg-[#faf8f4] p-0 sm:max-w-md dark:border-[#54462c] dark:bg-[#1a1917]">
        <div className="border-b border-[#eadcc2] bg-gradient-to-br from-[#fffaf0] via-[#fff7e8] to-[#f4e7cf] px-6 pb-6 pt-7 text-center dark:border-[#3e3528] dark:from-[#211d17] dark:via-[#1c1915] dark:to-[#2a2116]">
          <div className="relative mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#c8973a] to-[#e8b84b] text-white shadow-[0_9px_0_#9b6519,0_16px_30px_rgba(212,168,83,0.30)] ring-4 ring-white/60 dark:ring-white/10">
            <Crown className="size-10 fill-white/15" />
            <Sparkles className="absolute -right-2 -top-2 size-6 text-[#d4a853]" />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="text-2xl font-black text-[#b96c12] dark:text-[#e4b45d]">
              {copy.gateTitle}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 pb-6">
          <DialogDescription className="text-center text-sm leading-6 text-[#667085] dark:text-gray-300">
            {copy.gateDescription}
          </DialogDescription>

          <div className="rounded-2xl border-2 border-[#ead36d] bg-[#fffdf5] p-4 dark:border-[#5c4b25] dark:bg-[#242018]">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#9a6420] dark:text-[#f2bd62]">
              <Crown className="size-4 fill-current" />
              {copy.gateBenefitsTitle}
            </div>
            <div className="space-y-2.5">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#f6c515] shadow-[0_0_0_3px_rgba(246,197,21,0.13)]" />
                  <span className="text-sm leading-5 text-[#667085] dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-[#ded8cc] bg-transparent font-bold text-[#313744] shadow-none hover:bg-[#f1ede5] dark:border-[#494640] dark:text-gray-200 dark:hover:bg-[#2e2c29]"
            >
              {copy.cancel}
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false)
                onUnlock()
              }}
              className="h-11 rounded-xl bg-[#d4a853] font-bold text-white shadow-none hover:bg-[#bd913d] dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#c29f4f]"
            >
              <Crown className="size-4 fill-white/15" />
              {copy.unlock}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
