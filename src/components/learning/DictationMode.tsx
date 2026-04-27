'use client'

import { RefObject, useEffect, useRef, useState } from 'react'
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

interface DictationModeProps {
  segments: BilingualSegment[]
  iframeRef: RefObject<HTMLIFrameElement>
  session: DictationSession
  onSessionUpdate: (s: DictationSession) => void
  lessonId: string
  onComplete?: () => void
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
          stroke="#c9a84c" strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-[#c9a84c]">{pct}%</span>
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
              backgroundColor: '#c9a84c',
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
}: DictationModeProps) {
  const router = useRouter()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [submode, setSubmode] = useState<DictationSubmode>('full')
  const [userInputs, setUserInputs] = useState<Record<number, string>>({})
  const [inlineAnswersMap, setInlineAnswersMap] = useState<Record<number, string[]>>({})
  const [wordMasksMap, setWordMasksMap] = useState<Record<number, boolean[]>>({})
  const [checkResults, setCheckResults] = useState<Record<number, WordResult[]>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenuIdx, setShowSpeedMenuIdx] = useState<number | null>(null)
  const [revealConfirmIdx, setRevealConfirmIdx] = useState<number | null>(null)
  const [noteModalIdx, setNoteModalIdx] = useState<number | null>(null)
  const [reportModalIdx, setReportModalIdx] = useState<number | null>(null)
  const [segmentNotes, setSegmentNotes] = useState<Record<number, string>>({})
  const [tempNote, setTempNote] = useState('')
  const [reportTypes, setReportTypes] = useState<string[]>([])
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Task 11.1: Integrate useProgressFallback hook
  const { 
    session: serverSession, 
    loading: progressLoading, 
    error: progressError 
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

  const currentSeg = segments[currentIdx] ?? null
  const totalCount = segments.length

  const processedCount = Object.values(activeSession.results).filter(
    r => r.checked || r.skipped
  ).length
  const goodCount = Object.values(activeSession.results).filter(r => r.isGood).length
  const progressPct = calculateProgress(processedCount, totalCount)
  const allDone = totalCount > 0 && processedCount >= totalCount

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

    const savedInlineAnswers = localStorage.getItem(`dictation-inline-answers-${lessonId}`)
    if (savedInlineAnswers) {
      try {
        const parsed = JSON.parse(savedInlineAnswers)
        setInlineAnswersMap(parsed)
      } catch (error) {
        console.error('Failed to parse saved inline answers:', error)
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
  }, [lessonId])

  // Save user inputs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dictation-inputs-${lessonId}`, JSON.stringify(userInputs))
  }, [userInputs, lessonId])

  // Save inline answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dictation-inline-answers-${lessonId}`, JSON.stringify(inlineAnswersMap))
  }, [inlineAnswersMap, lessonId])

  // Save check results to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dictation-check-results-${lessonId}`, JSON.stringify(checkResults))
  }, [checkResults, lessonId])

  // Build masks when submode changes
  useEffect(() => {
    if (submode === 'fill-blank') {
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
      
      // Generate new masks if not found
      const masks: Record<number, boolean[]> = {}
      segments.forEach((seg, idx) => {
        masks[idx] = generateMasks(seg.text)
      })
      setWordMasksMap(masks)
      localStorage.setItem(`dictation-masks-${lessonId}`, JSON.stringify(masks))
    } else {
      setWordMasksMap({})
    }
    setUserInputs({})
    setInlineAnswersMap({})
    setCheckResults({})
    setIsPlaying(false)
  }, [submode, segments, lessonId])

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
    
    const words = tokenize(seg.text).filter(w => /[\w']/.test(w))

    let accuracy: number
    let result: WordResult[]

    if (submode === 'full') {
      const input = userInputs[segIdx] ?? ''
      result = compareWords(input, words)
      const correct = result.filter(r => r.correct).length
      accuracy = Math.round((correct / Math.max(words.length, 1)) * 100)
    } else {
      // fill-blank: only check masked positions
      const tokens = tokenize(seg.text)
      const wordMasks = wordMasksMap[segIdx] ?? []
      const inlineAnswers = inlineAnswersMap[segIdx] ?? []
      result = tokens.map((token, i) => ({
        word: token,
        userWord: wordMasks[i] ? (inlineAnswers[i] ?? '') : token,
        correct: wordMasks[i]
          ? (inlineAnswers[i] ?? '').trim().toLowerCase() === token.toLowerCase()
          : true,
      }))
      accuracy = scoreFillBlank(wordMasks, inlineAnswers, tokens)
    }

    setCheckResults(prev => ({ ...prev, [segIdx]: result }))

    // Play success sound if accuracy is good (>= 80%)
    if (accuracy >= 80) {
      playSuccessSound()
    }

    const updated: DictationSession = {
      ...activeSession,
      results: {
        ...activeSession.results,
        [seg.segmentIndex]: {
          segmentIndex: seg.segmentIndex,
          checked: true,
          skipped: false,
          accuracy,
          isGood: accuracy >= 80,
        },
      },
    }
    onSessionUpdate(updated)
    
    // Task 11.2: Call saveProgress on sentence completion
    saveProgress()
  }

  const handleSkipSegment = (segIdx: number) => {
    const seg = segments[segIdx]
    if (!seg) return
    
    const updated: DictationSession = {
      ...activeSession,
      results: {
        ...activeSession.results,
        [seg.segmentIndex]: {
          segmentIndex: seg.segmentIndex,
          checked: false,
          skipped: true,
          accuracy: 0,
          isGood: false,
        },
      },
    }
    onSessionUpdate(updated)
    
    // Task 11.2: Call saveProgress on sentence skip
    saveProgress()
  }

  const handleCheckAll = () => {
    segments.forEach((_, idx) => {
      if (!activeSession.results[segments[idx].segmentIndex]?.checked && 
          !activeSession.results[segments[idx].segmentIndex]?.skipped) {
        handleCheckSegment(idx)
      }
    })
  }

  const handleReset = async () => {
    onSessionUpdate({ results: {}, currentIdx: 0, submode })
    setUserInputs({})
    setInlineAnswersMap({})
    setCheckResults({})
    setCurrentIdx(0)
    localStorage.removeItem(`dictation-inputs-${lessonId}`)
    localStorage.removeItem(`dictation-inline-answers-${lessonId}`)
    localStorage.removeItem(`dictation-check-results-${lessonId}`)
    localStorage.removeItem(`dictation-masks-${lessonId}`)
    
    // Call DELETE /api/v1/progress to reset is_completed, completion_percentage, completed_at in DB
    try {
      await progressApi.resetProgress(parseInt(lessonId), submode)
    } catch (error) {
      console.error('Failed to reset progress on server:', error)
    }
  }

  const handleConfirmComplete = async () => {
    setShowCompletionModal(false)
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
    setShowCompletionModal(false)
    await handleReset()
  }

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có nội dung để luyện tập</p>
      </div>
    )
  }

  // Task 11.1: Show loading indicator while loading
  if (progressLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải tiến độ...</p>
        </div>
      </div>
    )
  }

  // Task 11.1: Show error message if error occurs
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
          <p className="text-xs text-gray-500 dark:text-gray-400">Tiến độ của bạn vẫn được lưu cục bộ và sẽ đồng bộ khi kết nối lại.</p>
        </div>
      </div>
    )
  }

  // Summary screen
  if (allDone) {
    return (
      <>
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Hoàn thành!</h2>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-[#c9a84c]">{progressPct}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tiến độ</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-500 dark:text-green-400">{goodCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Câu đúng ≥80%</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">{totalCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tổng số câu</p>
          </div>
        </div>
        <button
          onClick={() => setShowCompletionModal(true)}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#1a1a2e] bg-[#c9a84c] hover:bg-[#b8973b] transition-colors"
        >
          Tiếp tục
        </button>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">Hoàn thành bài học</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              Bạn đã hoàn thành tất cả các câu trong bài học này. Bạn có muốn đánh dấu nó là hoàn thành không?
            </p>
            <button
              onClick={handleConfirmComplete}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: '#1a1a2e' }}
            >
              Hoàn thành
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
            <button
              onClick={handleRetryFromModal}
              className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#252836] hover:bg-gray-50 dark:hover:bg-[#2e3142] transition-colors"
            >
              Làm lại bài học
            </button>
          </div>
        </div>
      )}
      </>
    )
  }

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Fixed header section - only title and stats */}
      <div className="flex-shrink-0">
        {/* Header card */}
        <div className="rounded-xl p-3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] m-4 mb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-[#252836] flex items-center justify-center flex-shrink-0 text-base">
              🎧
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100">
                Nghe chép chính tả – {totalCount} câu
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                Nghe audio từng câu và gõ lại những gì bạn nghe được. Hệ thống sẽ chấm điểm từng từ và chỉ ra lỗi sai.
              </p>
              <div className="flex gap-1.5 mt-2">
                {(['full', 'fill-blank'] as DictationSubmode[]).map(sm => (
                  <button
                    key={sm}
                    onClick={() => setSubmode(sm)}
                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors"
                    style={{
                      backgroundColor: submode === sm ? 'rgba(201,168,76,0.15)' : 'transparent',
                      borderColor: submode === sm ? '#c9a84c' : '#d1d5db',
                      color: submode === sm ? '#b8860b' : '#6b7280',
                    }}
                  >
                    {sm === 'full' ? 'Chép toàn câu' : 'Điền từ còn thiếu'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="rounded-xl p-3 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] flex items-center gap-3 mx-4 mb-3">
          <ProgressCircle pct={progressPct} />
          <div className="w-px h-8 bg-gray-200 dark:bg-[#2e3142]" />
          <div className="flex gap-4 flex-1">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{processedCount}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Đã hoàn thành</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{goodCount}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Câu đúng ≥80%</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{totalCount}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Tổng số câu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area - segments only */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* All segments input area */}
        <div className="flex flex-col gap-3">
        {segments.map((seg, segIdx) => {
          const tokens = tokenize(seg.text)
          const wordMasks = wordMasksMap[segIdx] ?? []
          const inlineAnswers = inlineAnswersMap[segIdx] ?? []
          const checkResult = checkResults[segIdx]
          const segResult = activeSession.results[seg.segmentIndex]
          const isChecked = segResult?.checked || false
          const isSkipped = segResult?.skipped || false
          const isPlayingThisSegment = isPlaying && currentIdx === segIdx

          return (
            <div 
              key={segIdx}
              className="rounded-xl p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]"
            >
              {/* Audio player for this segment */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-[#2e3142]">
                {/* Play button */}
                <button
                  onClick={() => {
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
                  style={{ backgroundColor: '#c9a84c' }}
                >
                  {isPlayingThisSegment ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1a1a2e">
                      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1a1a2e">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                {/* Waveform */}
                <div className="flex-1">
                  <Waveform playing={isPlayingThisSegment} />
                </div>

                {/* Câu X */}
                <span className="text-xs text-gray-400 flex-shrink-0">
                  Câu {segIdx + 1}
                </span>

                {/* Speed selector */}
                <div className="relative flex-shrink-0 speed-menu-container">
                  <button
                    onClick={() => setShowSpeedMenuIdx(showSpeedMenuIdx === segIdx ? null : segIdx)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#3a3d4f] hover:border-[#c9a84c]"
                  >
                    {playbackRate}x
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 8L1 3h10z" />
                    </svg>
                  </button>
                  {showSpeedMenuIdx === segIdx && (
                    <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl p-2 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] w-28">
                      {SPEEDS.map(rate => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange(rate)}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-[#252836]"
                          style={{
                            backgroundColor: playbackRate === rate ? 'rgba(201,168,76,0.15)' : 'transparent',
                            color: playbackRate === rate ? '#c9a84c' : undefined,
                          }}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Segment header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: currentIdx === segIdx ? '#c9a84c' : '#3a3d4f',
                      color: currentIdx === segIdx ? '#1a1a2e' : '#9ca3af',
                    }}
                  >
                    {segIdx + 1}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Gõ lại những gì bạn vừa nghe
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Note icon */}
                  <button
                    onClick={() => {
                      setNoteModalIdx(segIdx)
                      setTempNote(segmentNotes[segIdx] ?? '')
                    }}
                    title="Ghi chú"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-[#2e3142]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  {/* Report icon */}
                  <button
                    onClick={() => {
                      setReportModalIdx(segIdx)
                      setReportTypes([])
                    }}
                    title="Báo cáo"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-200 dark:hover:bg-[#2e3142]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </button>
                  {isChecked && segResult && (
                    <span 
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        backgroundColor: segResult.isGood ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                        color: segResult.isGood ? '#4ade80' : '#f87171',
                      }}
                    >
                      {segResult.accuracy}%
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-500/15 text-gray-400">
                      Đã bỏ qua
                    </span>
                  )}
                </div>
              </div>

              {submode === 'full' ? (
                /* Full dictation: textarea */
                <textarea
                  value={isChecked && segResult?.accuracy === 100 ? seg.text : (userInputs[segIdx] ?? '')}
                  onChange={e => setUserInputs(prev => ({ ...prev, [segIdx]: e.target.value }))}
                  placeholder="Nhập câu bạn nghe được..."
                  rows={2}
                  disabled={isSkipped || (isChecked && segResult?.accuracy === 100)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-[#252836] border border-gray-200 dark:border-[#3a3d4f] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#c9a84c] resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ) : (
                /* Fill-blank: inline inputs */
                <div className="flex flex-wrap gap-x-1.5 gap-y-2 items-baseline min-h-[50px] p-2 rounded-lg bg-white dark:bg-[#252836] border border-gray-200 dark:border-[#3a3d4f]">
                  {tokens.map((token, i) => {
                    const isMasked = wordMasks[i]
                    if (!isMasked) {
                      return (
                        <span key={i} className="text-sm text-gray-700 dark:text-gray-200">{token}</span>
                      )
                    }
                    const isRevealed = (inlineAnswers[i] ?? '') === token
                    return (
                      <div key={i} className="relative flex flex-col items-center">
                        {/* Hint eye button */}
                        {!isSkipped && !isRevealed && (
                          <button
                            onClick={() => {
                              const next = [...inlineAnswers]
                              next[i] = token
                              setInlineAnswersMap(prev => ({ ...prev, [segIdx]: next }))
                            }}
                            title="Gợi ý"
                            className="mb-0.5 text-[#4a9eff] hover:text-[#7bbfff] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        )}
                        {!isSkipped && isRevealed && <div className="mb-0.5 h-[14px]" />}
                        <input
                          type="text"
                          value={inlineAnswers[i] ?? ''}
                          onChange={e => {
                            const next = [...inlineAnswers]
                            next[i] = e.target.value
                            setInlineAnswersMap(prev => ({ ...prev, [segIdx]: next }))
                          }}
                          disabled={isSkipped}
                          className="text-sm text-center bg-transparent text-[#c9a84c] outline-none disabled:opacity-50"
                          style={{
                            borderBottom: '1.5px solid #c9a84c',
                            width: Math.max(40, token.length * 9) + 'px',
                            padding: '1px 2px',
                          }}
                          placeholder={'_'.repeat(Math.min(token.length, 6))}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Result display */}
              {(checkResult || (isChecked && segResult?.accuracy === 100)) && (
                <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1.5 items-baseline p-3 rounded-lg bg-gray-100 dark:bg-[#252836]">
                  {(checkResult ?? tokenize(seg.text).map(w => ({ word: w, userWord: w, correct: true }))).map((r, i) => (
                    <span
                      key={i}
                      className="text-sm font-medium"
                      style={{ color: r.correct ? '#4ade80' : '#f87171' }}
                    >
                      {r.word}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {!isSkipped && segResult?.accuracy !== 100 && (
                <div className="flex justify-end gap-2 mt-3">
                  {submode === 'fill-blank' && (
                    <button
                      onClick={() => setRevealConfirmIdx(segIdx)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors text-[#4a9eff] border-[#4a9eff]/40 hover:bg-[#4a9eff]/10"
                    >
                      Hiện tất cả từ
                    </button>
                  )}
                  <button
                    onClick={() => handleSkipSegment(segIdx)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={() => handleCheckSegment(segIdx)}
                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ backgroundColor: '#c9a84c', color: '#1a1a2e' }}
                  >
                    {isChecked ? 'Kiểm tra lại' : 'Kiểm tra'}
                  </button>
                </div>
              )}

              {/* Reveal all confirm dialog */}
              {revealConfirmIdx === segIdx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="rounded-2xl p-6 max-w-sm w-full mx-4 bg-[#1a1d27] border border-[#2e3142] shadow-2xl">
                    <p className="text-sm text-gray-200 leading-relaxed mb-5">
                      Bạn có chắc chắn muốn hiện tất cả từ và nộp câu trả lời không? Điểm của câu này sẽ bị giảm tùy theo số từ bạn đã hiện.
                    </p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setRevealConfirmIdx(null)}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#2e3142] text-gray-300 hover:bg-[#3a3d4f] transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          const tokens = tokenize(seg.text)
                          const masks = wordMasksMap[segIdx] ?? []
                          const current = inlineAnswersMap[segIdx] ?? []
                          const next = tokens.map((t, i) => masks[i] ? t : (current[i] ?? ''))
                          setInlineAnswersMap(prev => ({ ...prev, [segIdx]: next }))
                          setRevealConfirmIdx(null)
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Hiện
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                        <h3 className="text-lg font-bold">Thêm ghi chú</h3>
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
                    <p className="text-sm text-[#b8860b] mb-3">Nhập ghi chú cho câu này</p>
                    <textarea
                      value={tempNote}
                      onChange={e => setTempNote(e.target.value)}
                      placeholder="Nhập ghi chú..."
                      rows={4}
                      className="w-full rounded-lg px-3 py-2.5 text-sm bg-white border border-[#d4af37] text-gray-800 placeholder-gray-400 outline-none focus:border-[#b8860b] resize-none"
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          setSegmentNotes(prev => ({ ...prev, [segIdx]: tempNote }))
                          setNoteModalIdx(null)
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5dade2] text-white hover:bg-[#3498db] transition-colors"
                      >
                        Lưu ghi chú
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Report modal */}
              {reportModalIdx === segIdx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="rounded-2xl p-6 max-w-md w-full mx-4 bg-white dark:bg-[#2c3e50] shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Báo lỗi</h3>
                      <button
                        onClick={() => setReportModalIdx(null)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Phụ đề hiện tại</p>
                    <div className="bg-gray-100 dark:bg-[#34495e] rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">Tiếng Anh</p>
                      <p className="text-sm text-gray-800 dark:text-white">{seg.text}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Chọn loại lỗi</p>
                    <div className="space-y-2 mb-4">
                      {['Lỗi phụ đề tiếng Anh', 'Lỗi từ', 'Phụ đề chưa đồng bộ', 'Khác'].map(type => (
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
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Submit report
                          console.log('Report:', { segIdx, types: reportTypes })
                          setReportModalIdx(null)
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#5dade2] text-white hover:bg-[#3498db] transition-colors"
                      >
                        Gửi báo cáo
                      </button>
                    </div>
                  </div>
                </div>
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
              style={{ backgroundColor: '#c9a84c', color: '#1a1a2e' }}
            >
              Kiểm tra tất cả
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Completion Modal */}
    {showCompletionModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
            Hoàn thành bài học
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
            Bạn đã hoàn thành tất cả các câu trong bài học này. Bạn có muốn đánh dấu nó là hoàn thành không?
          </p>
          <button
            onClick={handleConfirmComplete}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            Hoàn thành
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </button>
          <button
            onClick={handleRetryFromModal}
            className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#252836] hover:bg-gray-50 dark:hover:bg-[#2e3142] transition-colors"
          >
            Làm lại bài học
          </button>
        </div>
      </div>
    )}
  </>
  )
}
