'use client'

import type { LanguageMode, TranscriptSegment } from '@/types/transcript'

interface TranscriptSegmentRowProps {
  segment: TranscriptSegment
  languageMode: LanguageMode
  isActive: boolean
  index: number
  onClick?: () => void
}

/**
 * TranscriptSegmentRow Component
 * 
 * Displays a single transcript segment row with support for:
 * - Three language modes: both, en, vi
 * - Active segment highlighting
 * - Light/dark theme support via Tailwind CSS variables
 * - Graceful handling of null Vietnamese text
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5, 5.1-5.8
 */
export default function TranscriptSegmentRow({
  segment,
  languageMode,
  isActive,
  index,
  onClick,
}: TranscriptSegmentRowProps) {
  // Rows: light mode keeps a soft gray edge; dark mode uses low-contrast hairlines + slight fill
  // so stacked rows never read as harsh “double” white/gold boxes.
  const containerClasses = `
    px-5 py-3 transition-all duration-200 cursor-pointer rounded-xl
    ${
      isActive
        ? `
          bg-app-accent-gold/15 shadow-sm
          border border-app-accent-gold/55
          dark:bg-[#2e2c29] dark:shadow-none
          dark:border-app-accent-gold/[0.38]
        `
        : `
          border border-app-border-primary/55
          bg-transparent hover:bg-app-bg-tertiary/35
          dark:border-white/[0.07] dark:bg-[#2e2c29]
          dark:hover:bg-[#353330] dark:hover:border-white/[0.09]
        `
    }
  `

  // Text styles with better readability
  const textClasses = `
    text-[15px] leading-relaxed transition-colors
    ${isActive ? 'text-app-text-primary font-medium' : 'text-app-text-secondary'}
  `

  // Number badge styles
  const numberClasses = `
    inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-md
    text-[11px] font-semibold mr-2.5 flex-shrink-0
    ${
      isActive
        ? 'bg-app-accent-gold text-white dark:text-[#0a0a0a]'
        : 'bg-app-bg-tertiary text-app-text-muted dark:bg-white/[0.08] dark:text-neutral-400'
    }
  `

  // Render both languages with clear separation (no labels)
  if (languageMode === 'both') {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English text */}
          <div className="flex items-start">
            <span className={numberClasses}>{index + 1}</span>
            <div className={textClasses}>
              {segment.text}
            </div>
          </div>
          
          {/* Vietnamese text */}
          <div className="flex items-start">
            <span className={numberClasses}>{index + 1}</span>
            <div className={`${textClasses} ${!segment.vietnameseText ? 'text-app-text-muted italic opacity-60' : ''}`}>
              {segment.vietnameseText || '(Chưa có bản dịch)'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render only English (no label)
  if (languageMode === 'en') {
    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="flex items-start">
          <span className={numberClasses}>{index + 1}</span>
          <div className={textClasses}>
            {segment.text}
          </div>
        </div>
      </div>
    )
  }

  // Render only Vietnamese (no label)
  if (languageMode === 'vi') {
    // If Vietnamese text is null/empty, show placeholder
    if (!segment.vietnameseText) {
      return (
        <div className={`${containerClasses} opacity-50`} onClick={onClick}>
          <div className="flex items-start">
            <span className={numberClasses}>{index + 1}</span>
            <div className="text-[15px] text-app-text-muted italic">
              (Chưa có bản dịch)
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={containerClasses} onClick={onClick}>
        <div className="flex items-start">
          <span className={numberClasses}>{index + 1}</span>
          <div className={textClasses}>
            {segment.vietnameseText}
          </div>
        </div>
      </div>
    )
  }

  return null
}
