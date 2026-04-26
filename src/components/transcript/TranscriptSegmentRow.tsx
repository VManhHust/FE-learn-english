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
  // Base styles for the row container with better visual hierarchy
  const containerClasses = `
    px-5 py-3 transition-all duration-200 cursor-pointer rounded-lg
    ${
      isActive
        ? 'bg-app-accent-gold/15 dark:bg-app-accent-gold/20 shadow-sm'
        : 'bg-transparent hover:bg-app-bg-tertiary/30 dark:hover:bg-app-bg-tertiary/20'
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
        ? 'bg-app-accent-gold text-white dark:text-app-bg-primary'
        : 'bg-app-bg-tertiary text-app-text-muted'
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
