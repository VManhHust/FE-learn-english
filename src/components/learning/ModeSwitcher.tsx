'use client'

import { LearningMode } from '@/lib/learning/types'
import { useLang } from '@/lib/i18n/LangProvider'
import { modeSwitcherI18n } from '@/lib/i18n/learn'

interface ModeSwitcherProps {
  mode: LearningMode
  onModeChange: (m: LearningMode) => void
  completedCount: number
  totalCount: number
  // Dictation stats
  dictationProgressPct?: number
  dictationProcessedCount?: number
  dictationGoodCount?: number
}

export default function ModeSwitcher({
  mode,
  onModeChange,
  completedCount,
  totalCount,
  dictationProgressPct = 0,
  dictationProcessedCount = 0,
  dictationGoodCount = 0,
}: ModeSwitcherProps) {
  const { lang } = useLang()
  const m = modeSwitcherI18n[lang]
  const goldBorder = '#c9a84c'
  const goldColor = '#b8860b'

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-200 dark:border-[#2e2c29] bg-white dark:bg-[#1a1917]">
      {/* Left: Mode tabs */}
      <div className="flex items-center gap-2">
      {/* Tab: Bilingual content */}
      <button
        onClick={() => onModeChange('bilingual')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          mode === 'bilingual'
            ? ''
            : 'text-gray-700 dark:text-gray-200'
        }`}
        style={{
          border: `1.5px solid ${mode === 'bilingual' ? goldBorder : 'transparent'}`,
          backgroundColor: mode === 'bilingual' ? 'rgba(201,168,76,0.1)' : 'transparent',
          color: mode === 'bilingual' ? goldColor : undefined,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="15" y2="18" />
        </svg>
        {m.tabBilingual}
      </button>

      {/* Tab: Dictation */}
      <button
        onClick={() => onModeChange('dictation')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          mode === 'dictation'
            ? ''
            : 'text-gray-700 dark:text-gray-200'
        }`}
        style={{
          border: `1.5px solid ${mode === 'dictation' ? goldBorder : 'transparent'}`,
          backgroundColor: mode === 'dictation' ? 'rgba(201,168,76,0.1)' : 'transparent',
          color: mode === 'dictation' ? goldColor : undefined,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        {m.tabDictation}
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            mode === 'dictation' ? '' : 'text-gray-700 dark:text-gray-200'
          }`}
          style={{
            backgroundColor: mode === 'dictation' ? 'rgba(201,168,76,0.15)' : 'rgba(128,128,128,0.12)',
            color: mode === 'dictation' ? goldColor : undefined,
          }}
        >
          {completedCount}/{totalCount}
        </span>
      </button>
    </div>

      {/* Right: Stats (only show when in dictation mode) */}
      {mode === 'dictation' && (
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: goldColor }}>{dictationProgressPct}%</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">{m.statsProgress}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700/30" />
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{dictationProcessedCount}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">{m.statsDone}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{dictationGoodCount}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">{m.statsGood}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{totalCount}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">{m.statsTotal}</p>
          </div>
        </div>
      )}
    </div>
  )
}
