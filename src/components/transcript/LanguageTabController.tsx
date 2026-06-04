'use client'

import { useEffect } from 'react'
import type { LanguageMode } from '@/types/transcript'
import { useLang } from '@/lib/i18n/LangProvider'
import { bilingualI18n } from '@/lib/i18n/learn'

interface LanguageTabControllerProps {
  selected: LanguageMode
  onChange: (language: LanguageMode) => void
}

const STORAGE_KEY = 'transcript-language-preference'

export default function LanguageTabController({
  selected,
  onChange,
}: LanguageTabControllerProps) {
  const { lang } = useLang()
  const b = bilingualI18n[lang]

  const tabs: Array<{ value: LanguageMode; label: string }> = [
    { value: 'both', label: b.tabBoth },
    { value: 'en', label: b.tabEnglish },
    { value: 'vi', label: b.tabVietnamese },
  ]

  // Load preference from sessionStorage on mount
  useEffect(() => {
    const savedPreference = sessionStorage.getItem(STORAGE_KEY) as LanguageMode | null
    if (savedPreference && ['both', 'en', 'vi'].includes(savedPreference)) {
      onChange(savedPreference)
    }
  }, [onChange])

  // Save preference to sessionStorage when it changes
  const handleTabClick = (language: LanguageMode) => {
    onChange(language)
    sessionStorage.setItem(STORAGE_KEY, language)
  }

  return (
    <div className="inline-flex gap-1 p-0.5 rounded-lg bg-app-bg-secondary/50 dark:bg-app-bg-secondary/20 border border-app-border-primary/20 dark:border-gray-700/30">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTabClick(tab.value)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${
              selected === tab.value
                ? 'bg-app-accent-gold text-white dark:text-app-bg-primary shadow-sm'
                : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-bg-tertiary/50'
            }
          `}
          aria-pressed={selected === tab.value}
          aria-label={b.ariaTabLabel(tab.label)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
