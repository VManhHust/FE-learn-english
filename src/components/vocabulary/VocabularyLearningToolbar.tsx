'use client'

import {
  ArrowLeft,
  Brain,
  CircleHelp,
  ChevronDown,
  Eye,
  Keyboard,
  RotateCcw,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type VocabularyLearningMode = 'guess' | 'flashcard' | 'quiz'

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
    { value: 'flashcard' as const, icon: Eye, label: 'Flashcard' },
    { value: 'guess' as const, icon: Brain, label: lang === 'vi' ? 'Đoán' : 'Guess' },
    { value: 'quiz' as const, icon: CircleHelp, label: lang === 'vi' ? 'Trắc nghiệm' : 'Quiz' },
  ]
  const activeMode = modes.find((item) => item.value === mode) ?? modes[0]
  const ActiveModeIcon = activeMode.icon

  return (
    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex h-10 min-w-0 flex-1 justify-between border-[#ded8cc] bg-white px-3 text-[#4b5563] shadow-sm md:hidden dark:border-[#2e2c29] dark:bg-[#171614] dark:text-[#d8d4ca]"
            aria-label={lang === 'vi' ? 'Chọn chế độ học' : 'Choose learning mode'}
          >
            <span className="flex min-w-0 items-center gap-2">
              <ActiveModeIcon className="size-4 shrink-0 text-[#b8832e] dark:text-[#d4b05a]" />
              <span className="truncate font-semibold">{activeMode.label}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-[#8a8578]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-52 rounded-xl border-[#ded8cc] bg-white p-1.5 dark:border-[#2e2c29] dark:bg-[#171614]"
        >
          {modes.map(({ value, icon: Icon, label }) => {
            const selected = mode === value
            return (
              <DropdownMenuItem
                key={value}
                onSelect={() => onModeChange(value)}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-semibold',
                  selected
                    ? 'bg-[#fff3d6] text-[#9a6b18] focus:bg-[#fff3d6] focus:text-[#9a6b18] dark:bg-[#2a2115] dark:text-[#d4b05a] dark:focus:bg-[#2a2115] dark:focus:text-[#d4b05a]'
                    : 'text-[#4b5563] focus:bg-[#f5f0e8] focus:text-[#9a6b18] dark:text-[#d8d4ca] dark:focus:bg-[#25231f] dark:focus:text-[#d4b05a]',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {selected && <span className="text-xs font-medium">{lang === 'vi' ? 'Đang dùng' : 'Active'}</span>}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

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
