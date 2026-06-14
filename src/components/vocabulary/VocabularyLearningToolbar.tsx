'use client'

import {
  ArrowLeft,
  Brain,
  CircleHelp,
  Eye,
  Keyboard,
  RotateCcw,
  Settings,
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
  showRepeat = false,
}: {
  lang: 'vi' | 'en'
  mode: VocabularyLearningMode
  onModeChange: (mode: VocabularyLearningMode) => void
  onShortcuts: () => void
  onSettings: () => void
  showRepeat?: boolean
}) {
  const modes = [
    { value: 'guess' as const, icon: Brain, label: lang === 'vi' ? 'Đoán' : 'Guess' },
    { value: 'flashcard' as const, icon: Eye, label: 'Flashcard' },
    { value: 'quiz' as const, icon: CircleHelp, label: lang === 'vi' ? 'Trắc nghiệm' : 'Quiz' },
    { value: 'reverse-quiz' as const, icon: RotateCcw, label: lang === 'vi' ? 'Trắc nghiệm đảo' : 'Reverse quiz' },
  ]

  return (
    <div className="flex items-center gap-2">
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
