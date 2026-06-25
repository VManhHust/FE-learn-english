'use client'

import { ChevronDown } from 'lucide-react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { VocabularyLearningMode } from '@/components/vocabulary/VocabularyLearningToolbar'

function SettingsSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative h-6 w-10 shrink-0 rounded-full bg-[#d8d1c4] outline-none transition data-[state=checked]:bg-[#d4a853] focus-visible:ring-2 focus-visible:ring-[#d4a853]/40 dark:bg-[#494640] dark:data-[state=checked]:bg-[#d4b05a]"
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px] dark:bg-[#171614]" />
    </SwitchPrimitive.Root>
  )
}

export function VocabularyShortcutsDialog({
  open,
  onOpenChange,
  lang,
  mode,
  includeSave = true,
  includePrevious = true,
  alwaysShowFlip = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: 'vi' | 'en'
  mode: VocabularyLearningMode
  includeSave?: boolean
  includePrevious?: boolean
  alwaysShowFlip?: boolean
}) {
  const answerFirst = mode !== 'flashcard'
  const shortcuts = [
    ...(mode === 'flashcard' || alwaysShowFlip
      ? [{ keys: ['Space', 'Enter'], vi: 'Lật thẻ', en: 'Flip card' }]
      : []),
    {
      keys: ['Z'],
      vi: answerFirst ? 'Chưa thành thạo (sau khi trả lời)' : 'Chưa thành thạo',
      en: answerFirst ? 'Not mastered (after answering)' : 'Not mastered',
    },
    {
      keys: ['X'],
      vi: answerFirst ? 'Thành thạo (sau khi trả lời)' : 'Thành thạo',
      en: answerFirst ? 'Mastered (after answering)' : 'Mastered',
    },
    ...(includeSave ? [{ keys: ['C'], vi: 'Lưu từ', en: 'Save word' }] : []),
    ...(includePrevious ? [{ keys: ['←'], vi: 'Xem từ trước', en: 'Previous word' }] : []),
    { keys: ['?'], vi: 'Mở bảng phím tắt', en: 'Open shortcuts' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
        <DialogHeader className="px-4 pb-4 pt-6 text-center sm:px-6 sm:pt-7">
          <DialogTitle className="text-center text-xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
            {lang === 'vi' ? 'Phím Tắt Bàn Phím' : 'Keyboard Shortcuts'}
          </DialogTitle>
          <DialogDescription className="pt-1 text-center text-sm text-[#6b7280] dark:text-[#aaa497]">
            {lang === 'vi'
              ? 'Sử dụng phím tắt bàn phím để học nhanh hơn'
              : 'Use keyboard shortcuts to study faster'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-4 pb-6 pt-2 text-sm text-[#374151] sm:px-6 sm:pb-7 dark:text-[#d8d4ca]">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.keys.join('-')} className="flex items-center gap-3">
              <div className="flex min-w-28 items-center gap-1.5">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="inline-flex min-w-7 items-center justify-center rounded-md border border-[#ded8cc] bg-[#faf8f3] px-2 py-1 font-sans text-xs font-semibold text-[#374151] shadow-sm dark:border-[#494640] dark:bg-[#25231f] dark:text-[#d8d4ca]">
                    {key}
                  </kbd>
                ))}
              </div>
              <span>{lang === 'vi' ? shortcut.vi : shortcut.en}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function VocabularySettingsDialog({
  open,
  onOpenChange,
  lang,
  showTranslation,
  onShowTranslationChange,
  showNotes,
  onShowNotesChange,
  soundEnabled,
  onSoundEnabledChange,
  preferredAccent,
  onPreferredAccentChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lang: 'vi' | 'en'
  showTranslation: boolean
  onShowTranslationChange: (checked: boolean) => void
  showNotes: boolean
  onShowNotesChange: (checked: boolean) => void
  soundEnabled: boolean
  onSoundEnabledChange: (checked: boolean) => void
  preferredAccent: 'US' | 'UK'
  onPreferredAccentChange: (accent: 'US' | 'UK') => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-0 overflow-y-auto rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
        <DialogHeader className="px-6 pb-5 pt-7 text-center">
          <DialogTitle className="text-center text-xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
            {lang === 'vi' ? 'Cài đặt' : 'Settings'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 px-4 pb-6 sm:px-6 sm:pb-7">
          <div className="space-y-5">
            {[
              {
                label: lang === 'vi' ? 'Hiển thị Bản dịch' : 'Show translation',
                checked: showTranslation,
                onChange: onShowTranslationChange,
              },
              {
                label: lang === 'vi' ? 'Hiển thị Chú giải' : 'Show notes',
                checked: showNotes,
                onChange: onShowNotesChange,
              },
              {
                label: lang === 'vi' ? 'Hiệu ứng âm thanh' : 'Sound effects',
                checked: soundEnabled,
                onChange: onSoundEnabledChange,
              },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">{setting.label}</Label>
                <SettingsSwitch checked={setting.checked} onCheckedChange={setting.onChange} label={setting.label} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">
              {lang === 'vi' ? 'Giọng phát âm' : 'Pronunciation accent'}
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 w-full justify-between border-[#ded8cc] bg-white px-3 font-normal text-[#374151] hover:bg-[#faf8f3] dark:border-[#494640] dark:bg-[#12110f] dark:text-[#d8d4ca]">
                  {preferredAccent === 'US'
                    ? (lang === 'vi' ? 'Tiếng Anh Mỹ (US)' : 'American English (US)')
                    : (lang === 'vi' ? 'Tiếng Anh Anh (UK)' : 'British English (UK)')}
                  <ChevronDown className="size-4 text-[#8a8578]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border border-[#ded8cc] bg-white p-1 dark:border-[#494640] dark:bg-[#171614]">
                {(['US', 'UK'] as const).map((accent) => (
                  <DropdownMenuItem
                    key={accent}
                    onSelect={() => onPreferredAccentChange(accent)}
                    className={cn('h-9 px-3', preferredAccent === accent && 'bg-[#d4a853] text-white focus:bg-[#bd9140] focus:text-white dark:bg-[#d4b05a] dark:text-[#171614]')}
                  >
                    {accent === 'US'
                      ? (lang === 'vi' ? 'Tiếng Anh Mỹ (US)' : 'American English (US)')
                      : (lang === 'vi' ? 'Tiếng Anh Anh (UK)' : 'British English (UK)')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
