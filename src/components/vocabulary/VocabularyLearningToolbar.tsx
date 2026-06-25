'use client'

import {
  ArrowLeft,
  Brain,
  CircleHelp,
  Eye,
  Keyboard,
  RotateCcw,
  Settings,
  Shuffle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type VocabularyLearningMode = 'guess' | 'flashcard' | 'quiz' | 'reverse-quiz'

export function VocabularyBackButton({
  lang,
  onClick,
}: {
  lang: 'vi' | 'en'
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      className="mb-3 border-[#ded8cc] bg-white transition-colors hover:border-[var(--accent-gold)] hover:bg-[rgba(201,168,76,0.1)] hover:text-[var(--accent-gold)] focus-visible:border-[var(--accent-gold)] focus-visible:text-[var(--accent-gold)] dark:border-[#2e2c29] dark:bg-[#171614] dark:hover:border-[var(--accent-gold)] dark:hover:bg-[rgba(212,176,90,0.12)] dark:hover:text-[var(--accent-gold)]"
      onClick={onClick}
    >
      <ArrowLeft className="size-4" />
      {lang === 'vi' ? 'Quay lại' : 'Back'}
    </Button>
  )
}

export function VocabularyModeToolbar({
  lang,
  mode,
  onModeChange,
  onShortcuts,
  onSettings,
  onShuffle,
  shuffling = false,
  showRepeat = false,
}: {
  lang: 'vi' | 'en'
  mode: VocabularyLearningMode
  onModeChange: (mode: VocabularyLearningMode) => void
  onShortcuts: () => void
  onSettings: () => void
  onShuffle?: () => void
  shuffling?: boolean
  showRepeat?: boolean
}) {
  const modes = [
    { value: 'guess' as const, icon: Brain, label: lang === 'vi' ? 'Đoán' : 'Guess' },
    { value: 'flashcard' as const, icon: Eye, label: 'Flashcard' },
    { value: 'quiz' as const, icon: CircleHelp, label: lang === 'vi' ? 'Trắc nghiệm' : 'Quiz' },
    { value: 'reverse-quiz' as const, icon: RotateCcw, label: lang === 'vi' ? 'Trắc nghiệm đảo' : 'Reverse quiz' },
  ]

  return (
    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
      <div className="hidden items-center gap-1 rounded-xl border border-[#ded8cc] bg-white p-1 shadow-sm md:flex dark:border-[#2e2c29] dark:bg-[#171614]">
        {modes.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            size="sm"
            onClick={() => onModeChange(value)}
            className={cn(
              'rounded-lg px-3 font-semibold shadow-sm',
              mode === value
                ? 'border border-[#d4a853] bg-[rgba(201,168,76,0.1)] text-[#b47f1d] hover:bg-[rgba(201,168,76,0.18)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]'
                : 'bg-transparent text-[#7a7060] hover:bg-[#f5f0e8] dark:text-[#9f998c] dark:hover:bg-[#25231f]',
            )}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
        {showRepeat && (
          <Button variant="ghost" size="sm" className="rounded-lg px-3 text-[#7a7060] hover:bg-[#f5f0e8] dark:hover:bg-[#25231f]">
            <RotateCcw className="size-4" />
            {lang === 'vi' ? 'Lặp lại' : 'Repeat'}
          </Button>
        )}
      </div>
      {onShuffle && (
        <div className="group relative">
          <Button
            variant="outline"
            size="icon"
            disabled={shuffling}
            aria-label={lang === 'vi' ? 'Trộn các từ chưa học' : 'Shuffle unlearned words'}
            onClick={onShuffle}
            className="border-[#ded8cc] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#b47f1d] hover:shadow-md dark:border-[#2e2c29] dark:bg-[#171614] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
          >
            <Shuffle className={cn('size-4 transition-transform duration-300 group-hover:rotate-180', shuffling && 'animate-spin')} />
          </Button>
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-[#e5d4ad] bg-[#fffdf8] px-3 py-2 text-xs font-semibold text-[#76551d] opacity-0 shadow-[0_8px_24px_rgba(91,67,23,0.16)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-[#594526] dark:bg-[#211e18] dark:text-[#e4c982]"
          >
            <span className="absolute bottom-full left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-l border-t border-[#e5d4ad] bg-[#fffdf8] dark:border-[#594526] dark:bg-[#211e18]" />
            {lang === 'vi' ? 'Trộn các từ chưa học' : 'Shuffle unlearned words'}
          </div>
        </div>
      )}
      <Button
        variant="outline"
        size="icon"
        aria-label={lang === 'vi' ? 'Phím tắt' : 'Shortcuts'}
        onClick={onShortcuts}
        className="border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]"
      >
        <Keyboard className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={lang === 'vi' ? 'Cài đặt' : 'Settings'}
        onClick={onSettings}
        className="border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]"
      >
        <Settings className="size-4" />
      </Button>
    </div>
  )
}
