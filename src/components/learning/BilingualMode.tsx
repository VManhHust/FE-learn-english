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
      <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-200 dark:border-[#2e3142]">
        <span className="text-xs text-gray-500 mr-2">Hiển thị:</span>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
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
      <div className="flex gap-0 border-b border-gray-200 dark:border-[#2e3142]">
        {(tab === 'both' || tab === 'english') && (
          <div
            className="flex-1 px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1d27]"
            style={{ minWidth: 0 }}
          >
            🇺🇸 ENGLISH
          </div>
        )}
        {tab === 'both' && <div className="w-px bg-gray-200 dark:bg-[#2e3142]" />}
        {(tab === 'both' || tab === 'vietnamese') && (
          <div
            className="flex-1 px-4 py-2 text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1d27]"
            style={{ minWidth: 0 }}
          >
            🇻🇳 TIẾNG VIỆT
          </div>
        )}
      </div>

      {/* Segment list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((seg, idx) => (
          <div
            key={seg.segmentIndex}
            className="flex gap-0 border-b border-gray-100 dark:border-[#2e3142] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            {/* English */}
            {(tab === 'both' || tab === 'english') && (
              <div className="flex-1 px-4 py-3 flex gap-3 items-start" style={{ minWidth: 0 }}>
                <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0 w-5 text-right">
                  {idx + 1}
                </span>
                <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{seg.text}</p>
              </div>
            )}

            {tab === 'both' && <div className="w-px bg-gray-200 dark:bg-[#2e3142] flex-shrink-0" />}

            {/* Vietnamese */}
            {(tab === 'both' || tab === 'vietnamese') && (
              <div className="flex-1 px-4 py-3 flex gap-3 items-start" style={{ minWidth: 0 }}>
                {tab === 'vietnamese' && (
                  <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0 w-5 text-right">
                    {idx + 1}
                  </span>
                )}
                {seg.translation ? (
                  <p className="text-sm leading-relaxed italic" style={{ color: '#6b9fd4' }}>
                    {seg.translation}
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed italic text-gray-400">
                    (Chưa có bản dịch)
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
