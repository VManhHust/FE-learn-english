'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BilingualSegment,
  DictationSession,
  DictationSubmode,
  WordResult,
} from '@/lib/learning/types'
import {
  tokenize,
  compareWords,
  calculateProgress,
  generateMasks,
  scoreFillBlank,
} from '@/lib/learning/helpers'
import { useProgressFallback } from '@/hooks/useProgressFallback'
import { useProgressSync } from '@/hooks/useProgressSync'
import { progressApi } from '@/lib/api/progress'
import { WordTooltip } from './WordTooltip'
import { createVideoNote, fetchNoteByModule } from '@/lib/api/video-notes'
import { useLang } from '@/lib/i18n/LangProvider'
import { dictationI18n } from '@/lib/i18n/learn'

interface DictationModeProps {
  segments: BilingualSegment[]
  iframeRef: RefObject<HTMLIFrameElement>
  session: DictationSession
  onSessionUpdate: (s: DictationSession) => void
  lessonId: string
  onComplete?: () => void
  onActiveSegmentChange?: (idx: number) => void
  onStatsChange?: (stats: { progressPct: number; processedCount: number; goodCount: number }) => void
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

// Play success sound effect - "ting ting" melody
function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // First "ting" - higher pitch
    const osc1 = audioContext.createOscillator()
    const gain1 = audioContext.createGain()
    osc1.connect(gain1)
    gain1.connect(audioContext.destination)
    
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
    
    gain1.gain.setValueAtTime(0.25, audioContext.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    
    osc1.start(audioContext.currentTime)
    osc1.stop(audioContext.currentTime + 0.2)
    
    // Second "ting" - even higher pitch (after short delay)
    const osc2 = audioContext.createOscillator()
    const gain2 = audioContext.createGain()
    osc2.connect(gain2)
    gain2.connect(audioContext.destination)
    
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1320, audioContext.currentTime + 0.15) // E6 note
    
    gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.15)
    gain2.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
    
    osc2.start(audioContext.currentTime + 0.15)
    osc2.stop(audioContext.currentTime + 0.4)
  } catch (error) {
    console.error('Failed to play sound:', error)
  }
}

function sendCommand(
  iframeRef: RefObject<HTMLIFrameElement>,
  func: string,
  args: unknown[] = []
) {
  iframeRef.current?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    'https://www.youtube.com'
  )
}

// Progress circle SVG
function ProgressCircle({ pct }: { pct: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#2e3142" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="#d4a853" strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-[#d4a853]">{pct}%</span>
    </div>
  )
}

// Waveform animation
function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-6">
      {Array.from({ length: 20 }).map((_, i) => {
        const height = 8 + Math.sin(i * 0.8) * 8
        const opacity = 0.7 + Math.sin(i * 0.5) * 0.3
        const duration = 0.8 + (i % 3) * 0.2
        const delay = i * 0.05
        
        return (
          <div
            key={i}
            className="w-0.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: '#d4a853',
              height: playing ? `${height}px` : '4px',
              opacity: playing ? opacity : 0.3,
              animationName: playing ? 'wave' : 'none',
              animationDuration: `${duration}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
      <style jsx>{`
        @keyframes wave {
          from {
            transform: scaleY(0.8);
          }
          to {
            transform: scaleY(1.2);
          }
        }
      `}</style>
    </div>
  )
}

export default function DictationMode({
  segments,
  iframeRef,
  session,
  onSessionUpdate,
  lessonId,
  onComplete,
  onActiveSegmentChange,
  onStatsChange,
}: DictationModeProps) {
  const router = useRouter()
  const { lang } = useLang()
  const d = dictationI18n[lang]
  const [currentIdx, setCurrentIdx] = useState(0)
  const [submode] = useState<DictationSubmode>('fill-blank') // Fixed to fill-blank mode
  const [userInputs, setUserInputs] = useState<Record<number, string>>({})
  const [wordMasksMap, setWordMasksMap] = useState<Record<number, boolean[]>>({})
  const [checkResults, setCheckResults] = useState<Record<number, WordResult[]>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenuIdx, setShowSpeedMenuIdx] = useState<number | null>(null)
  const [revealedWordsMap, setRevealedWordsMap] = useState<Record<number, boolean>>({})
  const [checkedSegments, setCheckedSegments] = useState<Record<number, boolean>>({})
  const [revealedIndividualWords, setRevealedIndividualWords] = useState<Record<number, Set<number>>>({})
  const [noteModalIdx, setNoteModalIdx] = useState<number | null>(null)
  const [reportModalIdx, setReportModalIdx] = useState<number | null>(null)
  const [segmentNotes, setSegmentNotes] = useState<Record<number, string>>({})
  const [tempNote, setTempNote] = useState('')
  const [reportTypes, setReportTypes] = useState<string[]>([])
  const [showReview, setShowReview] = useState(false)
  const [openTooltipWord, setOpenTooltipWord] = useState<string | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [showNoteSavedToast, setShowNoteSavedToast] = useState(false)
  const [collapsedSegments, setCollapsedSegments] = useState<Record<number, boolean>>({})
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** One-time initial accordion state per lesson after progress loads (not re-run on every session edit). */
  const initCollapsedForLessonRef = useRef<string | null>(null)

  // Notify parent when active segment changes (for keyboard shortcut sync)
  useEffect(() => {
    onActiveSegmentChange?.(activeSegmentIdx)
  }, [activeSegmentIdx, onActiveSegmentChange])

  // Task 11.1: Integrate useProgressFallback hook
  const { 
    session: serverSession, 
    loading: progressLoading, 
    error: progressError,
    reload: reloadProgress
  } = useProgressFallback({ lessonId, submode })

  // Task 11.2: Integrate useProgressSync hook
  const { saveProgress } = useProgressSync({
    lessonId,
    submode,
    session,
    enabled: !progressLoading,
    totalSegments: segments.length,
  })

  // Use session prop (updated by parent) as active session; serverSession only used for initial load
  const activeSession = session

  /** Stable key — do not put `segments` (array) in useEffect deps (length changes → invalid dep array in React). */
  const segmentsLayoutKey = useMemo(
    () => segments.map((s) => s.segmentIndex).join(','),
    [segments]
  )

  const currentSeg = segments[currentIdx] ?? null
  const totalCount = segments.length

  const processedCount = Object.values(activeSession.results).filter(
    r => r.checked
  ).length
  const goodCount = Object.values(activeSession.results).filter(r => r.isGood).length
  // Progress only counts sentences with accuracy >= 80% (isGood)
  const progressPct = calculateProgress(goodCount, totalCount)
  const allDone = totalCount > 0 && goodCount >= totalCount

  // Notify parent of stats changes
  useEffect(() => {
    onStatsChange?.({ progressPct, processedCount, goodCount })
  }, [progressPct, processedCount, goodCount, onStatsChange])

  // Sync server session with parent component
  useEffect(() => {
    if (serverSession && !progressLoading) {
      onSessionUpdate(serverSession)
    }
  }, [serverSession, progressLoading, onSessionUpdate])

  // Load user inputs from localStorage when component mounts
  useEffect(() => {
    const savedInputs = localStorage.getItem(`dictation-inputs-${lessonId}`)
    if (savedInputs) {
      try {
        const parsed = JSON.parse(savedInputs)
        setUserInputs(parsed)
      } catch (error) {
        console.error('Failed to parse saved inputs:', error)
      }
    }

    const savedCheckResults = localStorage.getItem(`dictation-check-results-${lessonId}`)
    if (savedCheckResults) {
      try {
        const parsed = JSON.parse(savedCheckResults)
        setCheckResults(parsed)
      } catch (error) {
        console.error('Failed to parse saved check results:', error)
      }
    }

    const savedRevealedWords = localStorage.getItem(`dictation-revealed-${lessonId}`)
    if (savedRevealedWords) {
      try {
        const parsed = JSON.parse(savedRevealedWords)
        setRevealedWordsMap(parsed)
      } catch (error) {
        console.error('Failed to parse saved revealed words:', error)
      }
    }
  }, [lessonId])

  // Load existing notes from server when segments are available
  // REMOVED: Don't preload all notes on mount - only fetch when user clicks note icon
  // This prevents unnecessary 404 requests for segments without notes

  // Initial expand/collapse: only 100% sentences start collapsed; others start expanded.
  // Must read `serverSession.results` from the progress hook: parent `session` often lags one
  // commit behind `onSessionUpdate`, so using only `activeSession` first-flushes as {} and
  // locks the wrong state via initCollapsedForLessonRef.
  useEffect(() => {
    if (segments.length === 0 || progressLoading) return

    const results = serverSession?.results ?? activeSession.results
    
    // If results is empty (after reset), expand all segments
    if (Object.keys(results).length === 0) {
      const allExpanded: Record<number, boolean> = {}
      segments.forEach((_, idx) => {
        allExpanded[idx] = false
      })
      setCollapsedSegments(allExpanded)
      return
    }
    
    // Otherwise, collapse only 100% accuracy segments
    const initialCollapsed: Record<number, boolean> = {}
    segments.forEach((seg, idx) => {
      const r = results[seg.segmentIndex]
      // Only collapse if accuracy is exactly 100, otherwise expand
      initialCollapsed[idx] = r?.accuracy === 100 ? true : false
    })
    setCollapsedSegments(initialCollapsed)
  }, [lessonId, segmentsLayoutKey, progressLoading, serverSession, activeSession, resetTrigger, segments])

  // Save user inputs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dictation-inputs-${lessonId}`, JSON.stringify(userInputs))
  }, [userInputs, lessonId])

  // Save check results to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dictation-check-results-${lessonId}`, JSON.stringify(checkResults))
  }, [checkResults, lessonId])

  // Save revealed words to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dictation-revealed-${lessonId}`, JSON.stringify(revealedWordsMap))
  }, [revealedWordsMap, lessonId])

  // Auto-complete segment when all words are revealed individually
  useEffect(() => {
    segments.forEach((seg, segIdx) => {
      // Skip if already checked
      if (activeSession.results[seg.segmentIndex]?.checked) return
      
      // Check if all words in this segment are revealed
      const tokens = tokenize(seg.text)
      const words = tokens.filter(w => /[\w']/.test(w))
      const wordCount = words.length
      
      if (wordCount === 0) return
      
      const revealedCount = revealedIndividualWords[segIdx]?.size || 0
      const isAllRevealed = revealedWordsMap[segIdx] || revealedCount >= wordCount
      
      if (isAllRevealed && !activeSession.results[seg.segmentIndex]?.checked) {
        // Auto-complete with 100% accuracy
        const updated: DictationSession = {
          ...activeSession,
          results: {
            ...activeSession.results,
            [seg.segmentIndex]: {
              segmentIndex: seg.segmentIndex,
              checked: true,
              skipped: false,
              accuracy: 100,
              isGood: true,
              attemptCount: 1,
              errorCount: 0,
            },
          },
        }
        onSessionUpdate(updated)
        
        // Mark as checked
        setCheckedSegments(prev => ({ ...prev, [segIdx]: true }))
        
        // Play success sound
        playSuccessSound()
        
        // Save progress
        saveProgress()
      }
    })
  }, [revealedIndividualWords, revealedWordsMap, segments, activeSession, onSessionUpdate, saveProgress])

  // Build masks when component mounts - mask ALL tokens initially
  useEffect(() => {
    // Try to load saved masks first
    const savedMasks = localStorage.getItem(`dictation-masks-${lessonId}`)
    if (savedMasks) {
      try {
        const parsed = JSON.parse(savedMasks)
        setWordMasksMap(parsed)
        return
      } catch (error) {
        console.error('Failed to parse saved masks:', error)
      }
    }
    
    // Generate new masks - mask EVERYTHING (all tokens including punctuation)
    const masks: Record<number, boolean[]> = {}
    segments.forEach((seg, idx) => {
      const tokens = tokenize(seg.text)
      // Mask ALL tokens - every single one
      masks[idx] = tokens.map(() => true)
    })
    setWordMasksMap(masks)
    localStorage.setItem(`dictation-masks-${lessonId}`, JSON.stringify(masks))
  }, [segments, lessonId])

  // Auto-pause at segment end
  useEffect(() => {
    if (!isPlaying || !currentSeg) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    const segEnd = currentSeg.endTime

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.youtube.com') return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'infoDelivery' && data?.info?.currentTime != null) {
          if (data.info.currentTime >= segEnd - 0.15) {
            sendCommand(iframeRef, 'pauseVideo')
            setIsPlaying(false)
          }
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)
    pollingRef.current = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        'https://www.youtube.com'
      )
    }, 300)
    return () => {
      window.removeEventListener('message', onMessage)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [isPlaying, currentSeg])

  // Close speed menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.speed-menu-container')) {
        setShowSpeedMenuIdx(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate)
    setShowSpeedMenuIdx(null)
    sendCommand(iframeRef, 'setPlaybackRate', [rate])
  }

  const goToSegment = (idx: number) => {
    setCurrentIdx(idx)
    setIsPlaying(false)
    sendCommand(iframeRef, 'pauseVideo')
  }

  const handleCheckSegment = (segIdx: number) => {
    const seg = segments[segIdx]
    if (!seg) return
    
    const input = userInputs[segIdx] ?? ''
    const tokens = tokenize(seg.text)
    const words = tokens.filter(w => /[\w']/.test(w))
    
    // Compare user input with correct text - word by word
    const result = compareWords(input, words)
    const correct = result.filter(r => r.correct).length
    const accuracy = Math.round((correct / Math.max(words.length, 1)) * 100)

    setCheckResults(prev => ({ ...prev, [segIdx]: result }))
    
    // Mark this segment as checked so we can show results inline
    setCheckedSegments(prev => ({ ...prev, [segIdx]: true }))

    // Play success sound if accuracy is good (>= 80%)
    if (accuracy >= 80) {
      playSuccessSound()
    }

    // Get previous result to track attempts
    const previousResult = activeSession.results[seg.segmentIndex]
    const previousAttemptCount = previousResult?.attemptCount ?? 0
    const previousErrorCount = previousResult?.errorCount ?? 0
    
    // Increment attempt count and error count if this attempt is wrong
    const isGood = accuracy >= 80
    const newAttemptCount = previousAttemptCount + 1
    const newErrorCount = isGood ? previousErrorCount : previousErrorCount + 1

    const updated: DictationSession = {
      ...activeSession,
      results: {
        ...activeSession.results,
        [seg.segmentIndex]: {
          segmentIndex: seg.segmentIndex,
          checked: true,
          skipped: false,
          accuracy,
          isGood,
          attemptCount: newAttemptCount,
          errorCount: newErrorCount,
        },
      },
    }
    onSessionUpdate(updated)
    
    // Task 11.2: Call saveProgress on sentence completion
    saveProgress()
  }

  // Helper function to compare character by character
  const compareCharacters = (userWord: string, correctWord: string): boolean[] => {
    const result: boolean[] = []
    const maxLen = Math.max(userWord.length, correctWord.length)
    
    for (let i = 0; i < maxLen; i++) {
      const userChar = (userWord[i] || '').toLowerCase()
      const correctChar = (correctWord[i] || '').toLowerCase()
      result.push(userChar === correctChar && userChar !== '')
    }
    
    return result
  }



  const handleRetrySegment = (segIdx: number) => {
    const seg = segments[segIdx]
    if (!seg) return
    
    // Clear the result for this segment
    const updatedResults = { ...activeSession.results }
    delete updatedResults[seg.segmentIndex]
    
    const updated: DictationSession = {
      ...activeSession,
      results: updatedResults,
    }
    onSessionUpdate(updated)
    
    // Clear local state for this segment
    setUserInputs(prev => {
      const newInputs = { ...prev }
      delete newInputs[segIdx]
      return newInputs
    })
    setCheckResults(prev => {
      const newResults = { ...prev }
      delete newResults[segIdx]
      return newResults
    })
    setRevealedWordsMap(prev => {
      const newRevealed = { ...prev }
      delete newRevealed[segIdx]
      return newRevealed
    })
    setCheckedSegments(prev => {
      const newChecked = { ...prev }
      delete newChecked[segIdx]
      return newChecked
    })
    setRevealedIndividualWords(prev => {
      const newRevealed = { ...prev }
      delete newRevealed[segIdx]
      return newRevealed
    })
    
    // Save progress to backend
    saveProgress()
  }

  const handleCheckAll = () => {
    segments.forEach((_, idx) => {
      if (!activeSession.results[segments[idx].segmentIndex]?.checked) {
        handleCheckSegment(idx)
      }
    })
  }

  // Receive global submit shortcut (Enter) from parent page.
  useEffect(() => {
    const handleSubmitCurrent = () => {
      const targetIdx = Math.min(activeSegmentIdx, Math.max(segments.length - 1, 0))
      if (targetIdx < 0 || !segments[targetIdx]) return
      const seg = segments[targetIdx]
      const result = activeSession.results[seg.segmentIndex]
      if (result?.accuracy === 100) return
      handleCheckSegment(targetIdx)
    }

    window.addEventListener('dictation:submit-current', handleSubmitCurrent as EventListener)
    return () => {
      window.removeEventListener('dictation:submit-current', handleSubmitCurrent as EventListener)
    }
  }, [activeSegmentIdx, segments, activeSession, handleCheckSegment])

  const handleReset = async () => {
    // Call DELETE /api/v1/progress to reset is_completed, completion_percentage, completed_at in DB
    try {
      await progressApi.resetProgress(parseInt(lessonId), submode)
      console.log('Progress reset on server')
    } catch (error) {
      console.error('Failed to reset progress on server:', error)
    }
    
    // Clear localStorage first
    localStorage.removeItem(`dictation-inputs-${lessonId}`)
    localStorage.removeItem(`dictation-check-results-${lessonId}`)
    localStorage.removeItem(`dictation-masks-${lessonId}`)
    localStorage.removeItem(`dictation-revealed-${lessonId}`)
    localStorage.removeItem(`dictation-progress-${lessonId}-${submode}`)
    
    // Reset all local state
    initCollapsedForLessonRef.current = null
    
    // Force all segments to be expanded immediately (false = expanded)
    const allExpanded: Record<number, boolean> = {}
    segments.forEach((_, idx) => {
      allExpanded[idx] = false
    })
    setCollapsedSegments(allExpanded)
    
    // Reset other state
    setUserInputs({})
    setCheckResults({})
    setRevealedWordsMap({})
    setCheckedSegments({})
    setRevealedIndividualWords({})
    setCurrentIdx(0)
    
    // Update session with empty results - this will trigger useEffect to expand all
    onSessionUpdate({ results: {}, currentIdx: 0, submode })
    
    // Reload progress from server to ensure serverSession is also empty
    await reloadProgress()
    
    // Trigger re-initialization of collapsed state
    setResetTrigger(prev => prev + 1)
  }

  const handleConfirmComplete = async () => {
    // Save with 100% completion - backend sets isCompleted=true and completedAt
    await saveProgress(true)
    // Navigate back to topics
    if (onComplete) {
      onComplete()
    } else {
      router.push('/dashboard/topics')
    }
  }

  const handleRetryFromModal = async () => {
    await handleReset()
  }

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-gray-400">{d.noContent}</p>
      </div>
    )
  }

  if (progressLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#d4a853] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{d.loadingProgress}</p>
        </div>
      </div>
    )
  }

  if (progressError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">{progressError}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{d.progressSyncError}</p>
        </div>
      </div>
    )
  }

  // Summary screen
  if (allDone) {
    const errorCount = Object.values(activeSession.results).filter(r => r.checked && !r.isGood).length

    return (
      <div className="flex flex-col items-center gap-6 py-10 px-6 overflow-y-auto">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{d.done}</h2>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-[#d4a853]">{progressPct}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.progressLabel}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-500 dark:text-green-400">{goodCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.correctSentences}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">{totalCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.totalSentences}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={handleConfirmComplete} className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: '#1a1a2e' }}>
            {d.complete}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </button>
          <button onClick={handleRetryFromModal} className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1917] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
            {d.retryLesson}
          </button>
          <button onClick={() => setShowReview(v => !v)} className="w-full py-3 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2" style={{ borderColor: '#d4a853', color: '#d4a853', backgroundColor: 'transparent' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {d.reviewLesson}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ transform: showReview ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </div>

        {/* Review panel */}
        {showReview && (
          <div className="w-full max-w-2xl flex flex-col gap-3">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                <p className="text-xs text-red-400 mt-1">{d.wrongSentences}</p>
              </div>
              <div className="rounded-xl p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                <p className="text-2xl font-bold text-green-500">{goodCount}</p>
                <p className="text-xs text-green-400 mt-1">{d.correctSentences}</p>
              </div>
            </div>

            {/* Per-segment review */}
            <div className="flex flex-col gap-2">
              {segments.map((seg, segIdx) => {
                const result = activeSession.results[seg.segmentIndex]
                const wordResults = checkResults[segIdx]
                if (!result) return null

                const isGood = result.isGood
                const accuracy = result.accuracy ?? 0
                const attemptCount = result.attemptCount ?? 1
                const errorCount = result.errorCount ?? 0

                return (
                  <div
                    key={segIdx}
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: isGood ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
                      borderColor: isGood ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{d.sentence} {segIdx + 1}</span>
                        {errorCount > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(248,113,113,0.2)', color: '#f87171' }} title={d.wrongTimes(errorCount)}>
                            ❌ {d.wrongTimes(errorCount)}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isGood ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                          color: isGood ? '#4ade80' : '#f87171',
                        }}
                      >
                        {accuracy}%
                      </span>
                    </div>

                    {/* Original text */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">"{seg.text}"</p>

                    {/* Attempt info */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{d.checkCount} {attemptCount} {errorCount > 0 ? `(${d.wrongTimes(errorCount)})` : ''}</p>

                    {/* Word-by-word result */}
                    {wordResults && (
                      <div className="flex flex-wrap gap-1">
                        {wordResults.map((w, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: w.correct
                                ? 'rgba(74,222,128,0.15)'
                                : 'rgba(248,113,113,0.2)',
                              color: w.correct ? '#4ade80' : '#f87171',
                              textDecoration: w.correct ? 'none' : 'underline',
                            }}
                          >
                            {w.correct ? w.word : (
                              <span title={d.correctWordLabel(w.word)}>
                                {w.userWord || '___'}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
    {/* Toast notification */}
    {showNoteSavedToast && (
      <div 
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down"
        style={{
          animation: 'fadeInDown 0.3s ease-out',
        }}
      >
        <div className="bg-white dark:bg-[#2c3e50] rounded-xl shadow-2xl border border-gray-200 dark:border-[#3a3d4f] px-4 py-3 flex items-center gap-2">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#4ade80" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {d.noteSaved}
          </span>
        </div>
      </div>
    )}
    <style jsx>{`
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
    `}</style>
    <div className="flex flex-col h-full">
      {/* Scrollable content area - segments only */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-3 pt-2">
        {/* All segments input area */}
        <div className="flex flex-col gap-1.5">
        {segments.map((seg, segIdx) => {
          const tokens = tokenize(seg.text)
          const wordMasks = wordMasksMap[segIdx] ?? []
          const checkResult = checkResults[segIdx]
          const segResult = activeSession.results[seg.segmentIndex]
          const isChecked = segResult?.checked || false
          const isPlayingThisSegment = isPlaying && currentIdx === segIdx
          const isRevealed = revealedWordsMap[segIdx] || false

          return (
            <div 
              key={segIdx}
              className="rounded-xl overflow-hidden bg-gray-50 dark:bg-[#2e2c29] border border-gray-200 dark:border-[#3a3835]"
            >
              {/* Single unified header row */}
              <div
                className={`flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 pt-2 sm:pt-2.5 mb-1.5 pb-1.5 cursor-pointer ${!collapsedSegments[segIdx] ? 'border-b border-gray-200 dark:border-gray-700/50' : ''}`}
                onClick={() => {
                  setActiveSegmentIdx(segIdx)
                  setCollapsedSegments(prev => ({ ...prev, [segIdx]: !prev[segIdx] }))
                }}
              >
                {/* Left side: Sentence number + Play button + Waveform */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-lg text-[11px] font-medium tabular-nums text-gray-500 dark:text-neutral-500 bg-gray-100/90 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08]"
                    aria-label={d.sentenceLabel(segIdx + 1)}
                  >
                    {segIdx + 1}
                  </span>
                  {/* Play button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSegmentIdx(segIdx)
                      if (isPlayingThisSegment) {
                        sendCommand(iframeRef, 'pauseVideo')
                        setIsPlaying(false)
                      } else {
                        setCurrentIdx(segIdx)
                        sendCommand(iframeRef, 'seekTo', [seg.startTime, true])
                        setTimeout(() => sendCommand(iframeRef, 'playVideo'), 100)
                        setIsPlaying(true)
                      }
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ 
                      backgroundColor: 'rgba(212, 168, 83, 0.15)',
                      border: '1px solid #d4a853'
                    }}
                  >
                    {isPlayingThisSegment ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#d4a853">
                        <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#d4a853">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                  </button>

                  {/* Waveform */}
                  <div className="flex-1 min-w-0">
                    <Waveform playing={isPlayingThisSegment} />
                  </div>
                </div>

                {/* Right side: Speed + Note + Report + Score */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {/* Speed selector - Hide on very small screens */}
                  <div className="relative speed-menu-container hidden xs:block">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowSpeedMenuIdx(showSpeedMenuIdx === segIdx ? null : segIdx) }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#3a3d4f] hover:border-[#d4a853]"
                    >
                      {playbackRate}x
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 8L1 3h10z" />
                      </svg>
                    </button>
                    {showSpeedMenuIdx === segIdx && (
                      <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl p-2 bg-white dark:bg-[#0f0e0c] border border-gray-200 dark:border-gray-700/50 w-28">
                        {SPEEDS.map(rate => (
                          <button
                            key={rate}
                            onClick={() => handleSpeedChange(rate)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                            style={{
                              backgroundColor: playbackRate === rate ? 'rgba(212,168,83,0.15)' : 'transparent',
                              color: playbackRate === rate ? '#d4a853' : undefined,
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note icon */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      setActiveSegmentIdx(segIdx)
                      // Auto-expand if collapsed
                      if (collapsedSegments[segIdx]) {
                        setCollapsedSegments(prev => ({ ...prev, [segIdx]: false }))
                      }
                      
                      // Load note on-demand when user clicks
                      const seg = segments[segIdx]
                      if (seg?.exerciseModuleId && !segmentNotes[segIdx]) {
                        try {
                          const note = await fetchNoteByModule(seg.exerciseModuleId)
                          if (note) {
                            setSegmentNotes(prev => ({ ...prev, [segIdx]: note.noteContent }))
                            setTempNote(note.noteContent)
                          } else {
                            setTempNote('')
                          }
                        } catch (error) {
                          console.error(`Failed to load note for segment ${segIdx}:`, error)
                          setTempNote('')
                        }
                      } else {
                        setTempNote(segmentNotes[segIdx] ?? '')
                      }
                      setNoteModalIdx(segIdx)
                    }}
                    title={d.noteHint}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-[#1a1a1a]"
                    style={{
                      backgroundColor: segmentNotes[segIdx] ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                    }}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={segmentNotes[segIdx] ? '#d4a853' : 'currentColor'}
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  {/* Report icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSegmentIdx(segIdx)
                      // Auto-expand if collapsed
                      if (collapsedSegments[segIdx]) {
                        setCollapsedSegments(prev => ({ ...prev, [segIdx]: false }))
                      }
                      
                      setReportModalIdx(segIdx)
                      setReportTypes([])
                    }}
                    title={d.reportHint}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-[#1a1a1a]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </button>

                  {/* Score badge - show real-time accuracy */}
                  {(() => {
                    const input = userInputs[segIdx] ?? ''
                    const tokens = tokenize(seg.text)
                    const words = tokens.filter(w => /[\w']/.test(w))
                    
                    // Calculate real-time accuracy
                    let accuracy = 0
                    if (segResult) {
                      // Use saved result if checked
                      accuracy = segResult.accuracy
                    } else if (input.trim()) {
                      // Calculate on-the-fly if user has typed something
                      const result = compareWords(input, words)
                      const correct = result.filter(r => r.correct).length
                      accuracy = Math.round((correct / Math.max(words.length, 1)) * 100)
                    }
                    
                    const isGood = accuracy >= 80
                    
                    return (
                      <span 
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{
                          backgroundColor: isGood ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                          color: isGood ? '#4ade80' : '#f87171',
                        }}
                      >
                        {accuracy}%
                      </span>
                    )
                  })()}

                  {/* Collapse/Expand button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSegmentIdx(segIdx)
                      setCollapsedSegments(prev => ({ ...prev, [segIdx]: !prev[segIdx] }))
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-200 dark:hover:bg-[#1a1a1a]"
                    title={collapsedSegments[segIdx] ? d.expandHint : d.collapseHint}
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      className="text-gray-600 dark:text-gray-400 transition-transform"
                      style={{ transform: collapsedSegments[segIdx] ? 'rotate(0deg)' : 'rotate(180deg)' }}
                    >
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                </div>
              </div>{/* end header row */}

              {/* Collapsible content */}
              {!collapsedSegments[segIdx] && (
                <>
              {/* Answer area: word hints on top, input + buttons below */}
              <div className="overflow-hidden">

              {/* Masked words display - shows asterisks or revealed words with character-level color coding */}
              <div 
                className="flex flex-wrap gap-1.5 sm:gap-2 items-center px-3 sm:px-4 py-2.5 border-0 border-b border-gray-200 dark:border-[#3a3835]/40 min-h-[60px]"
              >
                {tokens.map((token, i) => {
                  const isSegmentChecked = checkedSegments[segIdx]
                  const checkResult = checkResults[segIdx]
                  const individualRevealed = revealedIndividualWords[segIdx]?.has(i) || false
                  const isWord = /[\w']/.test(token) // Check if token is a word (not punctuation)
                  
                  // If accuracy is 100%, show all words in green (no masking) — hover opens WordTooltip
                  if (isChecked && segResult?.accuracy === 100) {
                    if (!isWord) {
                      return (
                        <span key={i} className="text-sm text-gray-500 dark:text-gray-400">
                          {token}
                        </span>
                      )
                    }
                    const tooltipId = `${segIdx}-${i}`
                    return (
                      <WordTooltip
                        key={tooltipId}
                        word={token}
                        isOpen={openTooltipWord === tooltipId}
                        onOpen={() => setOpenTooltipWord(tooltipId)}
                        onClose={() => setOpenTooltipWord(null)}
                      >
                        <div className="px-3 py-1 rounded-lg border border-green-500/35 dark:border-green-500/40 bg-gray-50 dark:bg-[#0f0e0c] cursor-default">
                          <span className="text-sm font-medium" style={{ color: '#4ade80' }}>
                            {token}
                          </span>
                        </div>
                      </WordTooltip>
                    )
                  }
                  
                  // If checked but not 100%, show character-by-character comparison
                  if (isSegmentChecked && checkResult) {
                    // Find matching result for this token
                    const wordResults = checkResult.filter(r => /[\w']/.test(r.word))
                    
                    if (isWord) {
                      // Find the corresponding word result
                      const wordIndex = tokens.slice(0, i).filter(t => /[\w']/.test(t)).length
                      const result = wordResults[wordIndex]
                      
                      if (result) {
                        if (result.correct) {
                          const tooltipId = `${segIdx}-${i}`
                          return (
                            <WordTooltip
                              key={tooltipId}
                              word={token}
                              isOpen={openTooltipWord === tooltipId}
                              onOpen={() => setOpenTooltipWord(tooltipId)}
                              onClose={() => setOpenTooltipWord(null)}
                            >
                              <div className="px-3 py-1 rounded-lg border border-green-500/35 dark:border-green-500/40 bg-gray-50 dark:bg-[#0f0e0c] cursor-default">
                                <span className="text-sm font-medium" style={{ color: '#4ade80' }}>
                                  {token}
                                </span>
                              </div>
                            </WordTooltip>
                          )
                        } else {
                          // Wrong word - show character by character
                          const userWord = result.userWord || ''
                          const correctWord = result.word
                          const charComparison = compareCharacters(userWord, correctWord)
                          
                          return (
                            <div 
                              key={i}
                              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0f0e0c] cursor-pointer hover:border-[#d4a853] dark:hover:border-[#d4a853] transition-colors"
                              onClick={() => {
                                if (!individualRevealed) {
                                  setRevealedIndividualWords(prev => {
                                    const current = prev[segIdx] || new Set<number>()
                                    const updated = new Set(current)
                                    updated.add(i)
                                    return { ...prev, [segIdx]: updated }
                                  })
                                }
                              }}
                            title={d.clickToRevealCorrect}
                            >
                                {individualRevealed ? (
                                  // Show full correct word
                                  <span 
                                    className="text-sm font-medium"
                                    style={{ color: '#4ade80' }}
                                  >
                                    {correctWord}
                                  </span>
                                ) : (
                                  // Show character by character with colors
                                  <span className="text-sm font-mono" style={{ letterSpacing: '0.05em' }}>
                                    {correctWord.split('').map((char, charIdx) => {
                                      const isCorrect = charComparison[charIdx]
                                      return (
                                        <span
                                          key={charIdx}
                                          style={{
                                            color: isCorrect ? '#4ade80' : '#f87171'
                                          }}
                                        >
                                          {isCorrect ? char : '*'}
                                        </span>
                                      )
                                    })}
                                  </span>
                                )}
                            </div>
                          )
                        }
                      }
                    }
                    
                    // Non-word tokens (punctuation, spaces) - always show in gray
                    return (
                      <span key={i} className="text-sm text-gray-500 dark:text-gray-400">
                        {token}
                      </span>
                    )
                  }
                  
                  // Not checked yet
                  // Non-word tokens (punctuation) - always show, never mask
                  if (!isWord) {
                    return (
                      <span key={i} className="text-sm text-gray-500 dark:text-gray-400">
                        {token}
                      </span>
                    )
                  }
                  
                  // Word tokens - show asterisks or revealed word (clickable to reveal)
                  const maskedDisplay = '*'.repeat(token.length)
                  
                  return (
                    <div 
                      key={i}
                      className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#0f0e0c] cursor-pointer hover:border-[#d4a853] dark:hover:border-[#d4a853] transition-colors"
                      onClick={() => {
                        if (!isRevealed && !individualRevealed) {
                          setRevealedIndividualWords(prev => {
                            const current = prev[segIdx] || new Set<number>()
                            const updated = new Set(current)
                            updated.add(i)
                            return { ...prev, [segIdx]: updated }
                          })
                        }
                      }}
                    title={(isRevealed || individualRevealed) ? "" : d.clickToReveal}
                    >
                      <span 
                        className="text-sm font-mono"
                        style={{ 
                          color: (isRevealed || individualRevealed) ? '#4ade80' : '#d4a853',
                          letterSpacing: '0.1em'
                        }}
                      >
                        {(isRevealed || individualRevealed) ? token : maskedDisplay}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Input area with buttons on the right */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch px-3 sm:px-4 py-1.5 bg-[#f5f3ef] dark:bg-[#0f0e0c]">
                <textarea
                  value={isChecked && segResult?.accuracy === 100 ? seg.text : (userInputs[segIdx] ?? '')}
                  onChange={e => setUserInputs(prev => ({ ...prev, [segIdx]: e.target.value }))}
                  onFocus={() => setActiveSegmentIdx(segIdx)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (segResult?.accuracy !== 100) {
                        handleCheckSegment(segIdx)
                      }
                    }
                  }}
                  placeholder={d.placeholder}
                  rows={2}
                  disabled={isChecked && segResult?.accuracy === 100}
                  className="flex-1 self-stretch rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0f0e0c] border border-gray-200 dark:border-[#3a3835] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#d4a853] dark:focus:border-[#d4a853]/60 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                {/* Buttons column */}
                <div className={`flex gap-2 ${segResult?.accuracy === 100 ? 'flex-row items-center justify-center w-full sm:w-auto' : 'flex-row sm:flex-col justify-end sm:justify-between sm:self-stretch'}`}>
                  {/* Show "Hiện tất cả" and "Kiểm tra" when not 100% */}
                  {segResult?.accuracy !== 100 && (
                    <>
                      {!isRevealed && (
                        <button
                          onClick={() => {
                            // Play success sound
                            playSuccessSound()
                            
                            // Mark as revealed
                            setRevealedWordsMap(prev => ({ ...prev, [segIdx]: true }))
                            
                            // Auto-complete this segment with 100% accuracy
                            const seg = segments[segIdx]
                            if (seg) {
                              const updated: DictationSession = {
                                ...activeSession,
                                results: {
                                  ...activeSession.results,
                                  [seg.segmentIndex]: {
                                    segmentIndex: seg.segmentIndex,
                                    checked: true,
                                    skipped: false,
                                    accuracy: 100,
                                    isGood: true,
                                    attemptCount: 1,
                                    errorCount: 0,
                                  },
                                },
                              }
                              onSessionUpdate(updated)
                              
                              // Mark as checked
                              setCheckedSegments(prev => ({ ...prev, [segIdx]: true }))
                              
                              // Save progress
                              saveProgress()
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                          style={{
                            borderWidth: '0.25px',
                            borderStyle: 'solid',
                            color: '#7a7670',
                            borderColor: '#7a7670',
                          }}
                        >
                          {d.revealAll}
                        </button>
                      )}
                      <button
                        onClick={() => handleCheckSegment(segIdx)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center justify-center"
                        style={{ 
                          backgroundColor: 'rgba(212, 168, 83, 0.15)',
                          color: '#d4a853',
                          border: '0.25px solid #d4a853'
                        }}
                      >
                        {isChecked ? d.recheck : d.check}
                      </button>
                    </>
                  )}
                  
                  {/* Show "Làm lại" when 100% */}
                  {segResult?.accuracy === 100 && (
                    <button
                      onClick={() => handleRetrySegment(segIdx)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors text-orange-500 border-orange-500/40 hover:bg-orange-500/10 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                      {d.retry}
                    </button>
                  )}
                </div>
              </div>
              </div>

              {/* Note modal */}
              {noteModalIdx === segIdx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="rounded-2xl p-6 max-w-md w-full mx-4 bg-[#fef9e7] shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[#b8860b]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <h3 className="text-lg font-bold">{d.noteModalTitle}</h3>
                      </div>
                      <button
                        onClick={() => setNoteModalIdx(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-[#b8860b] mb-3">{d.noteModalSubtitle}</p>
                    <textarea
                      value={tempNote}
                      onChange={e => setTempNote(e.target.value)}
                      placeholder={d.notePlaceholder}
                      rows={4}
                      className="w-full rounded-lg px-3 py-2.5 text-sm bg-white border border-[#d4af37] text-gray-800 placeholder-gray-400 outline-none focus:border-[#b8860b] resize-none"
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={async () => {
                          if (!tempNote.trim()) {
                            return
                          }
                          
                          const currentSegment = segments[segIdx]
                          if (!currentSegment || !currentSegment.exerciseModuleId) {
                            console.error('Missing exerciseModuleId for segment:', currentSegment)
                            return
                          }

                          try {
                            setSavingNote(true)
                            await createVideoNote({
                              exerciseModuleId: currentSegment.exerciseModuleId,
                              noteContent: tempNote.trim(),
                            })
                            
                            // Save to local state
                            setSegmentNotes(prev => ({ ...prev, [segIdx]: tempNote }))
                            setNoteModalIdx(null)
                            setTempNote('')
                            
                            // Show toast notification
                            setShowNoteSavedToast(true)
                            setTimeout(() => setShowNoteSavedToast(false), 2000)
                          } catch (error) {
                            console.error('Failed to save note:', error)
                          } finally {
                            setSavingNote(false)
                          }
                        }}
                        disabled={savingNote}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5dade2] text-white hover:bg-[#3498db] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingNote ? d.savingNote : d.saveNote}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Report modal */}
              {reportModalIdx === segIdx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="rounded-2xl p-6 max-w-md w-full mx-4 bg-white dark:bg-[#0f0e0c] shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{d.reportModalTitle}</h3>
                      <button
                        onClick={() => setReportModalIdx(null)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{d.reportCurrentCaption}</p>
                    <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">{d.reportEnglish}</p>
                      <p className="text-sm text-gray-800 dark:text-white">{seg.text}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{d.reportSelectType}</p>
                    <div className="space-y-2 mb-4">
                      {[d.reportType1, d.reportType2, d.reportType3, d.reportType4].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reportTypes.includes(type)}
                            onChange={e => {
                              if (e.target.checked) {
                                setReportTypes(prev => [...prev, type])
                              } else {
                                setReportTypes(prev => prev.filter(t => t !== type))
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-400 dark:border-gray-500 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{type}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setReportModalIdx(null)}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                      >
                        {d.cancel}
                      </button>
                      <button
                        onClick={() => {
                          console.log('Report:', { segIdx, types: reportTypes })
                          setReportModalIdx(null)
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5dade2] text-white hover:bg-[#3498db] transition-colors"
                      >
                        {d.submitReport}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          )
        })}
        </div>

        {/* Check all button */}
        {processedCount < totalCount && (
          <div className="flex justify-center mt-2">
            <button
              onClick={handleCheckAll}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ 
                backgroundColor: 'rgba(212, 168, 83, 0.15)',
                color: '#d4a853',
                border: '0.25px solid #d4a853'
              }}
            >
              {d.checkAll}
            </button>
          </div>
        )}
      </div>
    </div>
  </>
  )
}
