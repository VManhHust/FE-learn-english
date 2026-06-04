'use client'

/**
 * TranscriptViewer Component
 * 
 * Main container for bilingual transcript display with video synchronization.
 * Fetches transcript data from API, integrates video sync and auto-scroll,
 * and renders language tabs with segment rows.
 * 
 * **Validates: Requirements 2.1-2.6, 3.1-3.6, 4.1-4.6, 6.1-6.6, 8.1-8.6**
 */

import { useEffect, useState, useRef, RefObject } from 'react'
import { axiosInstance } from '@/lib/auth/authClient'
import { useVideoSync } from '@/hooks/useVideoSync'
import { useAutoScroll } from '@/hooks/useAutoScroll'
import { LanguageTabController, TranscriptSegmentRow } from '@/components/transcript'
import type { TranscriptSegment, LanguageMode } from '@/types/transcript'
import { useLang } from '@/lib/i18n/LangProvider'
import { bilingualI18n } from '@/lib/i18n/learn'

/**
 * Exercise module DTO from backend
 */
interface ExerciseModuleDto {
  id: number
  timeStartMs: number
  timeEndMs: number
  content: string
  vietnameseText?: string | null
}

/**
 * YouTube Player interface (minimal subset needed)
 */
interface YouTubePlayer {
  getCurrentTime(): number
  getPlayerState(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
}

interface TranscriptViewerProps {
  /** Lesson ID (learning exercise ID) to fetch transcript for */
  lessonId: number
  /** Reference to YouTube player instance */
  videoRef: RefObject<YouTubePlayer | null>
  /** Optional callback when segment is clicked */
  onSegmentClick?: (startTimeMs: number) => void
}

/**
 * Loading skeleton component
 */
function TranscriptSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="px-4 py-3 rounded-lg bg-app-bg-tertiary dark:bg-[#2e2c29]">
          <div className="h-4 bg-app-bg-secondary rounded w-3/4"></div>
          <div className="h-4 bg-app-bg-secondary rounded w-1/2 mt-2"></div>
        </div>
      ))}
    </div>
  )
}

/**
 * Error state component
 */
function TranscriptError({ 
  message, 
  onRetry,
  retryLabel,
}: { 
  message: string
  onRetry: () => void
  retryLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <svg
          className="mx-auto h-12 w-12 text-app-text-muted mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-app-text-secondary mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-app-accent-gold text-white dark:text-app-bg-primary rounded-lg hover:bg-app-accent-gold/90 transition-colors"
        >
          {retryLabel}
        </button>
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function TranscriptEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <svg
          className="mx-auto h-12 w-12 text-app-text-muted mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-app-text-secondary">{label}</p>
      </div>
    </div>
  )
}

/**
 * Main TranscriptViewer component
 */
export default function TranscriptViewer({
  lessonId,
  videoRef,
  onSegmentClick,
}: TranscriptViewerProps) {
  // i18n
  const { lang } = useLang()
  const b = bilingualI18n[lang]

  // State management
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageMode>('both')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)

  // Integrate video sync hook (Requirement 3.1-3.6)
  const { currentSegmentId } = useVideoSync(videoRef, segments)

  // Integrate auto-scroll hook (Requirement 4.1-4.6)
  const { scrollToSegment } = useAutoScroll(containerRef, currentSegmentId)

  /**
   * Fetch transcript data from API (Requirement 1.1-1.6)
   */
  const fetchTranscript = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.get<ExerciseModuleDto[]>(
        `/api/lessons/${lessonId}/transcript`
      )

      const data = response.data

      // Handle empty transcript (Requirement 6.1)
      if (!data || data.length === 0) {
        setSegments([])
        setIsLoading(false)
        return
      }

      // Map to TranscriptSegment format
      const mappedSegments: TranscriptSegment[] = data.map((module) => ({
        id: module.id,
        startTimeMs: module.timeStartMs,
        endTimeMs: module.timeEndMs,
        text: module.content,
        vietnameseText: module.vietnameseText || null,
      }))

      setSegments(mappedSegments)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error fetching transcript:', err)

      // Handle different error types (Requirement 6.2, 6.3, 6.6)
      if (err.response?.status === 404) {
        setError(b.errorNotFound)
      } else if (err.response?.status >= 500 || !err.response) {
        setError(b.errorLoad)
      } else {
        setError(b.errorLoad)
      }

      setIsLoading(false)
    }
  }

  /**
   * Fetch transcript on mount and when lessonId changes
   */
  useEffect(() => {
    fetchTranscript()
  }, [lessonId])

  /**
   * Handle segment click - seek video to segment start time
   */
  const handleSegmentClick = (segment: TranscriptSegment) => {
    if (onSegmentClick) {
      onSegmentClick(segment.startTimeMs)
    }
  }

  /**
   * Render loading state (Requirement 6.4)
   */
  if (isLoading) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#1a1917] flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-app-border-primary/50">
          <div className="h-10 bg-app-bg-tertiary rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-hidden px-2 py-3">
          <TranscriptSkeleton />
        </div>
      </div>
    )
  }

  /**
   * Render error state (Requirement 6.2, 6.3, 6.5)
   */
  if (error) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#1a1917] flex items-center justify-center">
        <TranscriptError message={error} onRetry={fetchTranscript} retryLabel={b.retry} />
      </div>
    )
  }

  /**
   * Render empty state (Requirement 6.1)
   */
  if (segments.length === 0) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#1a1917] flex items-center justify-center">
        <TranscriptEmpty label={b.transcriptNotAvailable} />
      </div>
    )
  }

  /**
   * Render transcript viewer with segments
   * Requirement 8.6: Responsive padding - smaller on mobile, larger on desktop
   */
  return (
    <div className="w-full h-full bg-white dark:bg-[#1a1917] flex flex-col">
      {/* Language tab controller (Requirement 2.1-2.6) */}
      <div className="px-4 pt-3 pb-2.5 border-b border-app-border-primary/10 dark:border-[#2e2c29] flex justify-center">
        <LanguageTabController
          selected={selectedLanguage}
          onChange={setSelectedLanguage}
        />
      </div>

      {/* Column headers - only show for "both" mode */}
      {selectedLanguage === 'both' && (
        <div className="px-5 py-2 border-b border-app-border-primary/10 dark:border-[#2e2c29] bg-app-bg-secondary/20 dark:bg-[#1a1917]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
              {b.columnEnglish}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
              {b.columnVietnamese}
            </div>
          </div>
        </div>
      )}

      {/* Single column header for en/vi modes */}
      {selectedLanguage === 'en' && (
        <div className="px-5 py-2 border-b border-app-border-primary/10 dark:border-[#2e2c29] bg-app-bg-secondary/20 dark:bg-[#1a1917]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
            {b.columnEnglish}
          </div>
        </div>
      )}

      {selectedLanguage === 'vi' && (
        <div className="px-5 py-2 border-b border-app-border-primary/10 dark:border-[#2e2c29] bg-app-bg-secondary/20 dark:bg-[#1a1917]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
            {b.columnVietnamese}
          </div>
        </div>
      )}

      {/* Transcript segments container with auto-scroll */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-2 py-3 space-y-2.5 
          scrollbar-thin 
          scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 
          scrollbar-track-transparent
          hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(55 65 81 / 0.5) transparent'
        }}
      >
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            data-segment-id={segment.id}
          >
            <TranscriptSegmentRow
              segment={segment}
              languageMode={selectedLanguage}
              isActive={currentSegmentId === segment.id}
              index={index}
              onClick={() => handleSegmentClick(segment)}
              noTranslationText={b.noTranslation}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
