'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function VocabularyReportButton({
  lang,
  onClick,
}: {
  lang: 'vi' | 'en'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={lang === 'vi' ? 'Báo lỗi từ vựng' : 'Report vocabulary issue'}
      title={lang === 'vi' ? 'Báo lỗi' : 'Report issue'}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="absolute left-5 top-5 z-20 flex size-8 items-center justify-center rounded-lg text-[#7a8495] transition hover:bg-[#fff8e8] hover:text-[var(--accent-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]/40 dark:text-[#9f998c] dark:hover:bg-[#2a2115] dark:hover:text-[var(--accent-gold)]"
    >
      <AlertTriangle className="size-4" />
    </button>
  )
}

export function VocabularyReportDialog({
  open,
  onOpenChange,
  lang,
  word,
  description,
  onDescriptionChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: 'vi' | 'en'
  word: string
  description: string
  onDescriptionChange: (description: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
        <DialogHeader className="px-4 pb-4 pt-6 text-center sm:px-6 sm:pt-7">
          <DialogTitle className="text-center text-xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">
            {lang === 'vi' ? 'Báo lỗi' : 'Report issue'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-4 pb-5 sm:px-6">
          <div className="rounded-2xl border border-[#dce3ee] bg-[#f8faff] px-4 py-3 dark:border-[#34312d] dark:bg-[#12110f]">
            <p className="text-xs font-medium uppercase tracking-wide text-[#69758a] dark:text-[#9f998c]">
              {lang === 'vi' ? 'Từ vựng' : 'Vocabulary'}
            </p>
            <p className="mt-1 text-base font-bold text-[#24284f] dark:text-[#e8e3d8]">{word}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vocabulary-review-report" className="text-xs font-medium uppercase tracking-wide text-[#69758a] dark:text-[#9f998c]">
              {lang === 'vi' ? 'Có gì sai?' : 'What is wrong?'}
            </Label>
            <textarea
              id="vocabulary-review-report"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder={lang === 'vi' ? 'Mô tả lỗi...' : 'Describe the issue...'}
              autoFocus
              className="min-h-28 w-full resize-y rounded-lg border-2 border-[#cbd3df] bg-white px-3 py-3 text-sm text-[#1a1a2e] outline-none transition placeholder:text-[#8490a3] focus:border-[#24284f] focus:ring-2 focus:ring-[#24284f]/15 dark:border-[#494640] dark:bg-[#0f0e0c] dark:text-[#e8e3d8] dark:focus:border-[var(--accent-gold)] dark:focus:ring-[var(--accent-gold)]/15"
            />
          </div>
        </div>

        <DialogFooter className="m-0 grid grid-cols-2 gap-2 border-t border-[#edf0f4] bg-white px-4 py-3 sm:flex sm:flex-row sm:justify-end sm:px-5 sm:py-2.5 dark:border-[#2e2c29] dark:bg-[#171614]">
          <DialogClose asChild>
            <Button variant="ghost" className="h-8 rounded-lg border-[0.25px] border-[#7a7670] bg-transparent px-4 text-xs font-medium text-[#7a7670] shadow-none hover:bg-gray-100 hover:text-[#7a7670] dark:hover:bg-gray-800">
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={!description.trim()}
            onClick={onSubmit}
            className="h-8 rounded-lg border-[0.25px] border-[#d4a853] bg-[rgba(212,168,83,0.15)] px-4 text-xs font-semibold text-[#d4a853] shadow-none hover:bg-[rgba(212,168,83,0.25)] disabled:border-[#d4a853] disabled:bg-[rgba(212,168,83,0.15)] disabled:text-[#d4a853] disabled:opacity-50"
          >
            {lang === 'vi' ? 'Gửi' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
