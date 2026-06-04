'use client'

import { useState } from 'react'
import { BilingualSegment, LanguageTab } from '@/lib/learning/types'
import { WordTooltip } from './WordTooltip'
import { useLang } from '@/lib/i18n/LangProvider'
import { bilingualI18n } from '@/lib/i18n/learn'

interface BilingualModeProps {
  segments: BilingualSegment[]
}

const TABS: { key: LanguageTab; label: string }[] = [
  { key: 'both', label: 'Cả hai' },
  { key: 'english', label: 'Tiếng Anh' },
  { key: 'vietnamese', label: 'Tiếng Việt' },
]

// Split text into word/non-word tokens for tooltip rendering
function tokenizeText(text: string): string[] {
  return text.match(/[\w']+|[^\w']+/g) ?? [text]
}

// Render English text with per-word WordTooltip
function EnglishText({ text, segIdx, openTooltip, setOpenTooltip }: {
  text: string
  segIdx: number
  openTooltip: string | null
  setOpenTooltip: (key: string | null) => void
}) {
  const tokens = tokenizeText(text)
  return (
    <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium flex flex-wrap">
      {tokens.map((token, i) => {
        const isWord = /[\w']/.test(token)
        if (!isWord) {
          return <span key={i}>{token}</span>
        }
        const tooltipId = `bilingual-${segIdx}-${i}`
        return (
          <WordTooltip
            key={tooltipId}
            word={token}
            isOpen={openTooltip === tooltipId}
            onOpen={() => setOpenTooltip(tooltipId)}
            onClose={() => setOpenTooltip(null)}
          >
            <span className="cursor-pointer hover:text-[#c9a84c] hover:underline decoration-dotted transition-colors">
              {token}
            </span>
          </WordTooltip>
        )
      })}
    </p>
  )
}

// Bilingual content display component with responsive layout
export default function BilingualMode({ segments }: BilingualModeProps) {
  const [tab, setTab] = useState<LanguageTab>('both')
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
  const { lang } = useLang()
  const b = bilingualI18n[lang]

  const TABS: { key: LanguageTab; label: string }[] = [
    { key: 'both', label: b.tabBoth },
    { key: 'english', label: b.tabEnglish },
    { key: 'vietnamese', label: b.tabVietnamese },
  ]

  const sorted = [...segments].sort((a, b) => a.segmentIndex - b.segmentIndex)

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-gray-400">{b.noContent}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Language tabs */}
      <div className="flex items-center gap-1 px-2 sm:px-4 py-3 border-b border-gray-200 dark:border-[#1a1917] overflow-x-auto">
        <span className="text-xs text-gray-500 mr-2 flex-shrink-0">{b.showLabel}</span>
        {TABS.map(t => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={
                isActive
                  ? {
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(212, 168, 83, 0.15)',
                      color: '#d4a853',
                      border: '1px solid #d4a853',
                    }
                  : {
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'transparent',
                      color: '#9ca3af',
                      border: '1px solid transparent',
                    }
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Header row */}
      {tab === 'both' ? (
        <div className="hidden sm:flex gap-0 border-b border-gray-200 dark:border-[#1a1917]">
          <div
            className="flex-1 px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1917]"
            style={{ minWidth: 0 }}
          >
            {b.headerEnglish}
          </div>
          <div className="w-px bg-gray-200 dark:bg-[#1a1917]" />
          <div
            className="flex-1 px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1917]"
            style={{ minWidth: 0 }}
          >
            {b.headerVietnamese}
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-200 dark:border-[#1a1917]">
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1917]">
            {tab === 'english' ? b.headerEnglish : b.headerVietnamese}
          </div>
        </div>
      )}

      {/* Segment list */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50 dark:bg-[#1a1917]">
        <div className="space-y-2 sm:space-y-4">
        {sorted.map((seg, idx) => {
          // For single language view, use full width centered layout
          if (tab === 'english' || tab === 'vietnamese') {
            return (
              <div
                key={seg.segmentIndex}
                className="max-w-4xl mx-auto"
              >
                {tab === 'english' && (
                  <div 
                    className="px-3 sm:px-6 py-3 sm:py-5 flex gap-2 sm:gap-4 items-start" 
                    style={{ 
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)'
                    }}
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 w-6 sm:w-8 text-right">
                      {idx + 1}
                    </span>
                    <EnglishText
                      text={seg.text}
                      segIdx={seg.segmentIndex}
                      openTooltip={openTooltip}
                      setOpenTooltip={setOpenTooltip}
                    />
                  </div>
                )}
                {tab === 'vietnamese' && (
                  <div 
                    className="px-3 sm:px-6 py-3 sm:py-5 flex gap-2 sm:gap-4 items-start" 
                    style={{ 
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)'
                    }}
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 w-6 sm:w-8 text-right">
                      {idx + 1}
                    </span>
                    {seg.translation ? (
                      <p className="text-sm sm:text-base leading-relaxed italic font-medium" style={{ color: '#3b82f6' }}>
                        {seg.translation}
                      </p>
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed italic text-gray-400 dark:text-gray-500">
                        {b.noTranslation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          }

          // For "both" view, use two-column layout on desktop, stack on mobile
          return (
          <div
            key={seg.segmentIndex}
            className="flex flex-col sm:flex-row gap-2 rounded-lg transition-all"
          >
            {/* English */}
            {(tab === 'both' || tab === 'english') && (
              <div 
                className="flex-1 px-3 sm:px-4 py-3 sm:py-4 flex gap-2 sm:gap-3 items-start" 
                style={{ 
                  minWidth: 0,
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '16px',
                  backgroundColor: '#1a1917'
                }}
              >
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0 w-6 text-right">
                  {idx + 1}
                </span>
                <EnglishText
                  text={seg.text}
                  segIdx={seg.segmentIndex}
                  openTooltip={openTooltip}
                  setOpenTooltip={setOpenTooltip}
                />
              </div>
            )}

            {/* Vietnamese */}
            {(tab === 'both' || tab === 'vietnamese') && (
              <div 
                className="flex-1 px-3 sm:px-4 py-3 sm:py-4 flex gap-2 sm:gap-3 items-start" 
                style={{ 
                  minWidth: 0,
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '16px',
                  backgroundColor: '#1a1917'
                }}
              >
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0 w-6 text-right sm:opacity-0">
                  {idx + 1}
                </span>
                {seg.translation ? (
                  <p className="text-xs sm:text-sm leading-relaxed italic font-medium" style={{ color: '#3b82f6' }}>
                    {seg.translation}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm leading-relaxed italic text-gray-400 dark:text-gray-500">
                    {b.noTranslation}
                  </p>
                )}
              </div>
            )}
          </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
