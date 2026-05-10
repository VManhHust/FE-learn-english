'use client'

import { useState } from 'react'
import { BilingualSegment, LanguageTab } from '@/lib/learning/types'

interface BilingualModeProps {
  segments: BilingualSegment[]
}

const TABS: { key: LanguageTab; label: string }[] = [
  { key: 'both', label: 'Cả hai' },
  { key: 'english', label: 'Tiếng Anh' },
  { key: 'vietnamese', label: 'Tiếng Việt' },
]

// Bilingual content display component with responsive layout
export default function BilingualMode({ segments }: BilingualModeProps) {
  const [tab, setTab] = useState<LanguageTab>('both')

  const sorted = [...segments].sort((a, b) => a.segmentIndex - b.segmentIndex)

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có nội dung cho bài học này</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Language tabs */}
      <div className="flex items-center gap-1 px-2 sm:px-4 py-3 border-b border-gray-200 dark:border-[#2e3142] overflow-x-auto">
        <span className="text-xs text-gray-500 mr-2 flex-shrink-0">Hiển thị:</span>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: tab === t.key ? '#1a1a2e' : 'transparent',
              color: tab === t.key ? '#fff' : '#9ca3af',
              border: tab === t.key ? 'none' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Header row */}
      {tab === 'both' ? (
        <div className="hidden sm:flex gap-0 border-b border-gray-200 dark:border-[#2e3142]">
          <div
            className="flex-1 px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1d27]"
            style={{ minWidth: 0 }}
          >
            🇺🇸 ENGLISH
          </div>
          <div className="w-px bg-gray-200 dark:bg-[#2e3142]" />
          <div
            className="flex-1 px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1d27]"
            style={{ minWidth: 0 }}
          >
            🇻🇳 TIẾNG VIỆT
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-200 dark:border-[#2e3142]">
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1d27]">
            {tab === 'english' ? '🇺🇸 ENGLISH' : '🇻🇳 TIẾNG VIỆT'}
          </div>
        </div>
      )}

      {/* Segment list */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50 dark:bg-[#0d0f14]">
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
                      border: '2px solid #d4af37',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)'
                    }}
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 w-6 sm:w-8 text-right">
                      {idx + 1}
                    </span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
                      {seg.text}
                    </p>
                  </div>
                )}
                {tab === 'vietnamese' && (
                  <div 
                    className="px-3 sm:px-6 py-3 sm:py-5 flex gap-2 sm:gap-4 items-start" 
                    style={{ 
                      border: '2px solid #d4af37',
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
                        (Chưa có bản dịch)
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
                  border: '2px solid #d4af37',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(212, 175, 55, 0.05)'
                }}
              >
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0 w-6 text-right">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium">{seg.text}</p>
              </div>
            )}

            {/* Vietnamese */}
            {(tab === 'both' || tab === 'vietnamese') && (
              <div 
                className="flex-1 px-3 sm:px-4 py-3 sm:py-4 flex gap-2 sm:gap-3 items-start" 
                style={{ 
                  minWidth: 0,
                  border: '2px solid #d4af37',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(212, 175, 55, 0.05)'
                }}
              >
                {tab === 'both' && (
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0 w-6 text-right sm:hidden">
                    {idx + 1}
                  </span>
                )}
                {seg.translation ? (
                  <p className="text-xs sm:text-sm leading-relaxed italic font-medium" style={{ color: '#3b82f6' }}>
                    {seg.translation}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm leading-relaxed italic text-gray-400 dark:text-gray-500">
                    (Chưa có bản dịch)
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
