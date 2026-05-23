'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { axiosInstance } from '@/lib/auth/authClient'
import ModeSwitcher from '@/components/learning/ModeSwitcher'
import DictationMode from '@/components/learning/DictationMode'
import TranscriptViewer from '@/components/transcript/TranscriptViewer'
import { BilingualSegment, DictationSession, LearningMode } from '@/lib/learning/types'

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
  }
}

interface Lesson {
  id: number
  title: string
  youtubeId?: string
  videoId?: string
  level: string
  vocabularyLevel?: string
  durationSeconds?: number
  topicId?: number
  topicName?: string
}

interface ExerciseModuleDto {
  id: number
  timeStartMs: number
  timeEndMs: number
  content: string
}

interface Segment {
  index: number
  start: number
  duration: number
  text: string
  // BE trả về các field này
  id?: number
  timeStartMs?: number
  timeEndMs?: number
  content?: string
}

type Difficulty = 'easy' | 'normal' | 'hard'

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444',
}

function maskWord(word: string, difficulty: Difficulty): { masked: boolean; text: string } {
  const clean = word.replace(/[^a-zA-Z0-9]/g, '')
  if (!clean) return { masked: false, text: word }
  if (difficulty === 'easy') return { masked: Math.random() < 0.3, text: word }
  if (difficulty === 'normal') return { masked: Math.random() < 0.6, text: word }
  return { masked: true, text: word }
}

function tokenize(text: string) {
  return text.match(/[\w']+|[^\w\s]/g) || []
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const SHORTCUT_STORAGE_KEY = 'linguaflow-lesson-shortcuts-v1'

type ShortcutAction = 'playPause' | 'next' | 'prev' | 'replay' | 'submit'

const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  playPause: 'tab',
  next: 'mod-arrowright',
  prev: 'mod-arrowleft',
  replay: 'backtick',
  submit: 'enter',
}

const SHORTCUT_OPTION_LIST: Record<ShortcutAction, { value: string; label: string }[]> = {
  playPause: [
    { value: 'tab', label: 'Tab' },
    { value: 'space', label: 'Space' },
  ],
  next: [
    { value: 'mod-arrowright', label: 'Ctrl/Command + →' },
    { value: 'shift-arrowright', label: 'Shift + →' },
  ],
  prev: [
    { value: 'mod-arrowleft', label: 'Ctrl/Command + ←' },
    { value: 'shift-arrowleft', label: 'Shift + ←' },
  ],
  replay: [
    { value: 'backtick', label: '`' },
    { value: 'ctrl-r', label: 'Ctrl + R' },
    { value: 'meta-r', label: 'Command + R' },
  ],
  submit: [
    { value: 'enter', label: 'Enter' },
    { value: 'mod-enter', label: 'Ctrl/Command + Enter' },
  ],
}

const SHORTCUT_MODAL_ROWS: { action: ShortcutAction; label: string }[] = [
  { action: 'playPause', label: 'Phát / Dừng' },
  { action: 'next', label: 'Tiếp theo' },
  { action: 'prev', label: 'Trước' },
  { action: 'replay', label: 'Phát lại' },
  { action: 'submit', label: 'Nộp bài' },
]

function normalizeShortcuts(raw: Partial<Record<ShortcutAction, string>> | null): Record<ShortcutAction, string> {
  const base: Record<ShortcutAction, string> = { ...DEFAULT_SHORTCUTS }
  if (!raw) return base
  ;(Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[]).forEach((action) => {
    const v = raw[action]
    const allowed = SHORTCUT_OPTION_LIST[action].some((o) => o.value === v)
    if (allowed && v) base[action] = v
  })
  return base
}

function eventMatchesShortcutBinding(e: KeyboardEvent, binding: string): boolean {
  const mod = e.ctrlKey || e.metaKey
  const shift = e.shiftKey
  const alt = e.altKey

  switch (binding) {
    case 'tab':
      return e.key === 'Tab' && !mod && !shift && !alt
    case 'space':
      return e.key === ' ' && !mod && !shift && !alt
    case 'mod-arrowright':
      return mod && e.key === 'ArrowRight' && !shift && !alt
    case 'shift-arrowright':
      return shift && !mod && !alt && e.key === 'ArrowRight'
    case 'mod-arrowleft':
      return mod && e.key === 'ArrowLeft' && !shift && !alt
    case 'shift-arrowleft':
      return shift && !mod && !alt && e.key === 'ArrowLeft'
    case 'backtick':
      return (e.key === '`' || e.code === 'Backquote') && !mod && !shift && !alt
    case 'ctrl-r':
      return e.ctrlKey && !e.metaKey && !shift && !alt && e.key.toLowerCase() === 'r'
    case 'meta-r':
      return e.metaKey && !e.ctrlKey && !shift && !alt && e.key.toLowerCase() === 'r'
    case 'enter':
      return e.key === 'Enter' && !mod && !shift && !alt
    case 'mod-enter':
      return mod && e.key === 'Enter' && !shift && !alt
    default:
      return false
  }
}

function ShortcutDropdown({
  fieldId,
  label,
  options,
  value,
  onChange,
  openId,
  onOpenChange,
}: {
  fieldId: string
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  openId: string | null
  onOpenChange: (id: string | null) => void
}) {
  const open = openId === fieldId
  const selected = options.find((o) => o.value === value) ?? options[0]

  return (
    <div className="relative" data-shortcut-select-root>
      <p className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">{label}</p>
      <button
        type="button"
        onClick={(ev) => {
          ev.stopPropagation()
          onOpenChange(open ? null : fieldId)
        }}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-[#2e3142] bg-white dark:bg-[#14161f] text-xs text-gray-800 dark:text-white"
      >
        <span className="truncate">{selected?.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-gray-500 dark:text-gray-400">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 dark:border-[#2e3142] bg-white dark:bg-[#0d0f14] shadow-xl">
          {options.map((opt) => {
            const isSel = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onChange(opt.value)
                  onOpenChange(null)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  isSel
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className="inline-flex w-3 flex-shrink-0 justify-center">
                  {isSel ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-95">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  ) : null}
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DictationPage() {
  const params = useParams()
  const id = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [hideMedia, setHideMedia] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string[]>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({})
  const [segmentMasks, setSegmentMasks] = useState<Record<number, boolean[]>>({})
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const playerRef = useRef<YT.Player | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  
  // Create a wrapper for TranscriptViewer that provides getCurrentTime method
  const playerWrapperRef = useRef<{ getCurrentTime: () => number } | null>(null)

  // Speed popup
  const [showSpeedPopup, setShowSpeedPopup] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const speedRef = useRef<HTMLDivElement>(null)

  // Settings modal
  const [showSettings, setShowSettings] = useState(false)
  const [autoReveal, setAutoReveal] = useState(true)
  const [showCaption, setShowCaption] = useState(true)
  const [soundEffect, setSoundEffect] = useState(true)

  // Keyboard shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [shortcutBindings, setShortcutBindings] = useState<Record<ShortcutAction, string>>(DEFAULT_SHORTCUTS)
  const [shortcutsDraft, setShortcutsDraft] = useState<Record<ShortcutAction, string>>(DEFAULT_SHORTCUTS)
  const [openShortcutDropdown, setOpenShortcutDropdown] = useState<string | null>(null)

  // Video playing state
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false) // Track if video has been played at least once
  const [buttonFlash, setButtonFlash] = useState(false) // Track button flash animation

  // Learning mode (bilingual / dictation)
  const [learningMode, setLearningMode] = useState<LearningMode>('bilingual')
  const [bilingualSegments, setBilingualSegments] = useState<BilingualSegment[]>([])
  const [dictationSession, setDictationSession] = useState<DictationSession>({
    results: {}, currentIdx: 0, submode: 'full',
  })
  const [dictationActiveSegmentIdx, setDictationActiveSegmentIdx] = useState(0)
  const [dictationStats, setDictationStats] = useState({ progressPct: 0, processedCount: 0, goodCount: 0 })

  const currentSegment = segments[currentIdx] || null

  const correctCount = segments.filter((s) => {
    const words = tokenize(s.text)
    const ans = answers[s.index] || []
    return words.every((w, i) => {
      const mask = segmentMasks[s.index]?.[i]
      if (!mask) return true
      return (ans[i] || '').trim().toLowerCase() === w.toLowerCase()
    })
  }).length

  const progress = segments.length > 0 ? Math.round((correctCount / segments.length) * 100) : 0

  const buildMasks = useCallback((segs: Segment[], diff: Difficulty) => {
    const masks: Record<number, boolean[]> = {}
    segs.forEach((s) => {
      const words = tokenize(s.text)
      masks[s.index] = words.map((w) => maskWord(w, diff).masked)
    })
    return masks
  }, [])

  useEffect(() => {
    // Fetch lesson and transcript separately to handle transcript errors gracefully
    let lessonDone = false
    let transcriptDone = false
    const checkDone = () => {
      if (lessonDone && transcriptDone) setLoading(false)
    }

    axiosInstance.get<Lesson>(`/api/lessons/${id}`)
      .then(res => setLesson(res.data))
      .catch(console.error)
      .finally(() => { lessonDone = true; checkDone() })

    axiosInstance.get<ExerciseModuleDto[]>(`/api/lessons/${id}/transcript`)
      .then(res => {
        const mapped: Segment[] = res.data.map((m, i) => ({
          index: i,
          start: (m.timeStartMs ?? 0) / 1000,
          duration: ((m.timeEndMs ?? 0) - (m.timeStartMs ?? 0)) / 1000,
          text: m.content ?? '',
          id: m.id,
          timeStartMs: m.timeStartMs,
          timeEndMs: m.timeEndMs,
          content: m.content,
        }))
        setSegments(mapped)
        setSegmentMasks(buildMasks(mapped, difficulty))
        
        // Map to BilingualSegment format for DictationMode
        const bilingualMapped: BilingualSegment[] = res.data
          .filter(m => m.content && m.content.trim().length > 0) // Filter out empty segments
          .map((m, i) => ({
            segmentIndex: i,
            startTime: (m.timeStartMs ?? 0) / 1000,
            endTime: (m.timeEndMs ?? 0) / 1000,
            text: m.content ?? '',
            translation: null, // Will be loaded by TranscriptViewer from /api/v1/transcript
            exerciseModuleId: m.id, // Add exerciseModuleId for video notes
          }))
        setBilingualSegments(bilingualMapped)
      })
      .catch((err) => {
        if (err?.response?.status === 503) {
          setTranscriptError('Không thể tải transcript, vui lòng thử lại sau')
        }
      })
      .finally(() => { transcriptDone = true; checkDone() })
  }, [id])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SHORTCUT_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<ShortcutAction, string>>
        setShortcutBindings(normalizeShortcuts(parsed))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (openShortcutDropdown === null) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target
      if (t instanceof Element && t.closest('[data-shortcut-select-root]')) return
      setOpenShortcutDropdown(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openShortcutDropdown])

  useEffect(() => {
    if (segments.length > 0) {
      setSegmentMasks(buildMasks(segments, difficulty))
      setAnswers({})
      setRevealed({})
    }
  }, [difficulty, segments, buildMasks])

  // Load YouTube IFrame API and init player
  const lessonLevel = lesson?.level ?? lesson?.vocabularyLevel ?? 'A1'
  const youtubeId = lesson?.youtubeId ?? lesson?.videoId

  useEffect(() => {
    if (!youtubeId) return

    const initPlayer = () => {
      if (!iframeRef.current) return
      // Destroy old player if exists
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: { onReady: () => {} },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      // Only add script once
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script')
        tag.id = 'yt-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
    }
  }, [youtubeId])

  const [iframeReady, setIframeReady] = useState(false)

  const sendPlayerCommand = (func: string, args?: unknown[]) => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args: args ?? [] }),
      'https://www.youtube.com'
    )
  }

  // Store current time for TranscriptViewer
  const currentTimeRef = useRef<number>(0)

  const getCurrentTime = (): Promise<number> => {
    return new Promise((resolve) => {
      if (!iframeRef.current?.contentWindow) {
        resolve(0)
        return
      }

      const handleMessage = (e: MessageEvent) => {
        if (e.origin !== 'https://www.youtube.com') return
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
          if (data?.event === 'infoDelivery' && data?.info?.currentTime != null) {
            window.removeEventListener('message', handleMessage)
            currentTimeRef.current = data.info.currentTime
            resolve(data.info.currentTime)
          }
        } catch {
          resolve(0)
        }
      }

      window.addEventListener('message', handleMessage)
      
      // Request current time
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'listening' }),
        'https://www.youtube.com'
      )

      // Timeout after 1 second
      setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        resolve(0)
      }, 1000)
    })
  }
  
  // Initialize player wrapper for TranscriptViewer
  useEffect(() => {
    playerWrapperRef.current = {
      getCurrentTime: () => currentTimeRef.current,
    }
  }, [])

  const handleToggleMedia = () => {
    setHideMedia(!hideMedia)
  }

  const handleIframeLoad = () => {
    setIframeReady(true)
    // Tell YouTube iframe to start listening and enable info delivery
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening' }),
      'https://www.youtube.com'
    )
    // Enable video info delivery (needed for currentTime polling)
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
      'https://www.youtube.com'
    )
  }

  // Close speed popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setShowSpeedPopup(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate)
    setShowSpeedPopup(false)
    sendPlayerCommand('setPlaybackRate', [rate])
  }

  const handlePlay = () => {
    if (isPlaying) {
      sendPlayerCommand('pauseVideo')
      setIsPlaying(false)
      setIsPlayingSegment(false)
    } else {
      sendPlayerCommand('playVideo')
      setIsPlaying(true)
      setHasStarted(true) // Mark that video has been played
      setIsPlayingSegment(false) // Không kích hoạt auto-pause khi phát toàn bộ
    }
  }

  const handleReplay = () => {
    const start = learningMode === 'dictation'
      ? (bilingualSegments[dictationActiveSegmentIdx]?.startTime ?? 0)
      : (currentSegment?.start ?? 0)
    sendPlayerCommand('seekTo', [start, true])
    setTimeout(() => {
      sendPlayerCommand('playVideo')
      setIsPlaying(true)
      setIsPlayingSegment(true)
    }, 100)
  }

  const handlePlaySegment = () => {
    if (isPlaying) {
      sendPlayerCommand('pauseVideo')
      setIsPlaying(false)
      setIsPlayingSegment(false)
    } else {
      const start = currentSegment?.start ?? 0
      sendPlayerCommand('seekTo', [start, true])
      setTimeout(() => {
        sendPlayerCommand('playVideo')
        setIsPlaying(true)
        setIsPlayingSegment(true)
      }, 100)
    }
  }

  const handleReplaySegment = handlePlaySegment

  const isTypingElement = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
  }

  // Poll video time to auto-pause at end of current segment
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPlayingSegment, setIsPlayingSegment] = useState(false)

  useEffect(() => {
    if (!isPlaying || !currentSegment || !isPlayingSegment) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    const segEnd = currentSegment.start + currentSegment.duration

    pollingRef.current = setInterval(() => {
      // Ask YouTube for current time via postMessage
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        'https://www.youtube.com'
      )
    }, 300)

    // Listen for time updates from YouTube iframe
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.youtube.com') return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'infoDelivery' && data?.info?.currentTime != null) {
          const currentTime: number = data.info.currentTime
          if (currentTime >= segEnd - 0.15) {
            sendPlayerCommand('pauseVideo')
            setIsPlaying(false)
            setIsPlayingSegment(false)
            if (pollingRef.current) clearInterval(pollingRef.current)
          }
        }
      } catch {}
    }

    window.addEventListener('message', onMessage)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      window.removeEventListener('message', onMessage)
    }
  }, [isPlaying, currentSegment, isPlayingSegment])

  // Request time updates from YouTube (always poll for TranscriptViewer)
  useEffect(() => {
    if (!iframeReady) return
    
    const interval = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        'https://www.youtube.com'
      )
    }, 50) // Poll every 50ms for better transcript sync responsiveness
    
    return () => clearInterval(interval)
  }, [iframeReady])
  
  // Listen for time updates and player state changes from YouTube
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.youtube.com') return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        
        // Update current time
        if (data?.event === 'infoDelivery' && data?.info?.currentTime != null) {
          currentTimeRef.current = data.info.currentTime
          
          // Also check playerState from infoDelivery
          if (data?.info?.playerState != null) {
            const playerState = data.info.playerState
            if (playerState === 1) {
              setIsPlaying(true)
              setHasStarted(true)
            } else if (playerState === 2 || playerState === 0) {
              setIsPlaying(false)
            }
          }
        }
        
        // Handle onStateChange event
        if (data?.event === 'onStateChange') {
          const playerState = data?.info
          // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          if (playerState === 1) {
            // Playing
            setIsPlaying(true)
            setHasStarted(true)
          } else if (playerState === 2 || playerState === 0) {
            // Paused or Ended
            setIsPlaying(false)
          }
        }
      } catch {}
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const handleWordInput = (segIdx: number, wordIdx: number, value: string) => {
    setAnswers(prev => {
      const segAnswers = [...(prev[segIdx] || [])]
      segAnswers[wordIdx] = value
      return { ...prev, [segIdx]: segAnswers }
    })
  }

  const handleRevealAll = () => {
    if (!currentSegment) return
    setRevealed(r => ({ ...r, [currentSegment.index]: true }))
  }

  const handleNext = () => {
    if (learningMode === 'dictation') {
      const nextIdx = dictationActiveSegmentIdx + 1
      if (nextIdx >= bilingualSegments.length) return
      setDictationActiveSegmentIdx(nextIdx)
      const nextSeg = bilingualSegments[nextIdx]
      if (nextSeg) {
        sendPlayerCommand('seekTo', [nextSeg.startTime, true])
        setTimeout(() => {
          sendPlayerCommand('playVideo')
          setIsPlaying(true)
          setIsPlayingSegment(true)
        }, 100)
      }
      return
    }
    if (currentIdx < segments.length - 1) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      const nextSeg = segments[nextIdx]
      if (nextSeg) {
        sendPlayerCommand('seekTo', [nextSeg.start, true])
        setTimeout(() => {
          sendPlayerCommand('playVideo')
          setIsPlaying(true)
          setIsPlayingSegment(true)
        }, 100)
      }
    }
  }

  const handlePrev = () => {
    if (learningMode === 'dictation') {
      const prevIdx = dictationActiveSegmentIdx - 1
      if (prevIdx < 0) return
      setDictationActiveSegmentIdx(prevIdx)
      const prevSeg = bilingualSegments[prevIdx]
      if (prevSeg) {
        sendPlayerCommand('seekTo', [prevSeg.startTime, true])
        setTimeout(() => {
          sendPlayerCommand('playVideo')
          setIsPlaying(true)
          setIsPlayingSegment(true)
        }, 100)
      }
      return
    }
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1
      setCurrentIdx(prevIdx)
      const prevSeg = segments[prevIdx]
      if (prevSeg) {
        sendPlayerCommand('seekTo', [prevSeg.start, true])
        setTimeout(() => {
          sendPlayerCommand('playVideo')
          setIsPlaying(true)
          setIsPlayingSegment(true)
        }, 100)
      }
    }
  }

  // Keyboard shortcuts for quick learning controls (after handleNext/handlePrev — avoids TDZ)
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (isTypingElement(e.target)) return
      if (showSettings || showShortcuts) return

      const b = shortcutBindings

      if (learningMode === 'dictation' && eventMatchesShortcutBinding(e, b.submit)) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('dictation:submit-current'))
        return
      }

      if (eventMatchesShortcutBinding(e, b.playPause)) {
        e.preventDefault()
        handlePlay()
        return
      }

      if (eventMatchesShortcutBinding(e, b.next)) {
        e.preventDefault()
        handleNext()
        return
      }

      if (eventMatchesShortcutBinding(e, b.prev)) {
        e.preventDefault()
        handlePrev()
        return
      }

      if (eventMatchesShortcutBinding(e, b.replay)) {
        e.preventDefault()
        handleReplay()
        return
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [
    showSettings,
    showShortcuts,
    learningMode,
    shortcutBindings,
    handlePlay,
    handleNext,
    handlePrev,
    handleReplay,
  ])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!lesson) return <div className="p-6 text-sm text-gray-500">Không tìm thấy bài học</div>

  const currentWords = currentSegment ? tokenize(currentSegment.text) : []
  const currentMasks = currentSegment ? (segmentMasks[currentSegment.index] || []) : []
  const currentAnswers = currentSegment ? (answers[currentSegment.index] || []) : []
  const isRevealed = currentSegment ? !!revealed[currentSegment.index] : false

  return (
    <>
    <div className="flex flex-col bg-[#f5f3ef] dark:bg-[#0f0e0c]" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Breadcrumb */}
      <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-2 sm:pb-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] text-gray-600 dark:text-gray-400 overflow-x-auto shadow-sm" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <Link href="/dashboard/topics" className="hover:underline whitespace-nowrap">Topics</Link>
          <span className="flex-shrink-0">›</span>
          {lesson.topicId && lesson.topicName && (
            <>
              <Link 
                href={`/dashboard/topics/${lesson.topicId}`} 
                className="hover:underline cursor-pointer whitespace-nowrap hidden sm:inline"
              >
                {lesson.topicName}
              </Link>
              <span className="flex-shrink-0 hidden sm:inline">›</span>
            </>
          )}
          <span className="font-medium truncate max-w-[150px] sm:max-w-xs text-app-accent-gold">{lesson.title}</span>
          <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0"
            style={{ backgroundColor: LEVEL_COLORS[lessonLevel] ?? '#6b7280' }}>
            {lessonLevel}
          </span>
          <div className="ml-auto flex gap-2 sm:gap-4 flex-shrink-0">
            <button onClick={handleToggleMedia} className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap text-xs sm:text-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span className="hidden sm:inline">{hideMedia ? 'Hiện Media' : 'Ẩn Media'}</span>
              <span className="sm:hidden">{hideMedia ? 'Hiện' : 'Ẩn'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-column layout - responsive: stack on mobile, 2-col on tablet, 3-col on desktop */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-2 sm:gap-3 px-2 sm:px-3 pb-2 sm:pb-3 bg-[#f5f3ef] dark:bg-[#0f0e0c]">

        {/* Col 1: Video */}
        <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 overflow-y-auto rounded-xl bg-white dark:bg-[#1a1917] w-full lg:w-[360px] lg:max-w-[360px] flex-shrink-0 shadow-sm" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Video</span>
            {lesson?.durationSeconds && (
              <span className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {formatTime(lesson.durationSeconds)}
              </span>
            )}
          </div>

          {youtubeId && (
            <div className={`rounded-xl overflow-hidden border-2 border-blue-500 dark:border-blue-600 ${hideMedia ? 'hidden' : ''}`}>
              <iframe
                ref={iframeRef}
                id="yt-player"
                width="100%"
                height="180"
                className="sm:h-[200px]"
                src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleIframeLoad}
              />
            </div>
          )}

          {hideMedia && (
            <div className="rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex items-center justify-center h-[180px] sm:h-[200px]">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-50">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <p className="text-sm">Media đã ẩn</p>
                <p className="text-xs mt-1">Video vẫn đang phát</p>
              </div>
            </div>
          )}

          {/* Navigation + Settings on one row */}
          <div className="flex items-center justify-between mt-3">
            {/* Left: prev + replay + play + next */}
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} disabled={currentIdx === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836] disabled:opacity-30 text-base font-semibold text-gray-700 dark:text-gray-200">
                ‹
              </button>
              <button onClick={handleReplaySegment}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836]"
                title="Phát lại đoạn này">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-200">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
              </button>
              <button onClick={handlePlay}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836]"
                title={isPlaying ? 'Dừng' : 'Tiếp tục'}>
                {isPlaying ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 dark:text-gray-200">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 dark:text-gray-200"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
              </button>
              <button onClick={handleNext} disabled={currentIdx === segments.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836] disabled:opacity-30 text-base font-semibold text-gray-700 dark:text-gray-200">
                ›
              </button>
            </div>

            {/* Right: speed + settings + keyboard */}
            <div className="flex items-center gap-1">
              <div className="relative" ref={speedRef}>
                <button
                  onClick={() => setShowSpeedPopup(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${showSpeedPopup ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  {playbackRate}x
                </button>
                {showSpeedPopup && (
                  <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-lg p-3 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]"
                    style={{ width: 220 }}>
                    <p className="text-xs font-bold mb-2.5 text-[#1a1a2e] dark:text-gray-100">Tốc độ phát lại</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                        <button key={rate} onClick={() => handleSpeedChange(rate)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                            playbackRate === rate
                              ? 'bg-[#1a1a2e] dark:bg-blue-600 text-white border-[#1a1a2e] dark:border-blue-600'
                              : 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-[#3a3d4f]'
                          }`}>
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowSettings(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836]" title="Cài đặt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-200">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  setShortcutsDraft({ ...shortcutBindings })
                  setOpenShortcutDropdown(null)
                  setShowShortcuts(true)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836]" title="Phím tắt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-200">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                // Original handlePlay logic
                if (handlePlay) handlePlay()
              }}
              onMouseEnter={(e) => {
                const isDark = document.documentElement.classList.contains('dark')
                e.currentTarget.style.color = isDark ? '#ffffff' : '#000000'
                e.currentTarget.style.borderColor = isDark ? '#ffffff' : '#000000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#7a7670'
                e.currentTarget.style.borderColor = '#7a7670'
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ 
                backgroundColor: 'transparent',
                borderWidth: '0.25px',
                borderStyle: 'solid',
                color: '#7a7670',
                borderColor: '#7a7670',
              }}
            >
              {isPlaying ? (
                <>
                  {/* Pause icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  Dừng
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {hasStarted ? 'Tiếp tục' : 'Bắt đầu'}
                </>
              )}
            </button>
            <button
              onClick={handleReplay}
              onMouseEnter={(e) => {
                const isDark = document.documentElement.classList.contains('dark')
                e.currentTarget.style.color = isDark ? '#ffffff' : '#000000'
                e.currentTarget.style.borderColor = isDark ? '#ffffff' : '#000000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#7a7670'
                e.currentTarget.style.borderColor = '#7a7670'
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ 
                backgroundColor: 'transparent',
                borderWidth: '0.25px',
                borderStyle: 'solid',
                color: '#7a7670',
                borderColor: '#7a7670',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              Phát lại
            </button>
          </div>
        </div>

        {/* Col 2: Mode switcher + content */}
        <div className="flex flex-col flex-1 overflow-hidden rounded-xl bg-white dark:bg-[#1a1917] w-full lg:w-auto shadow-sm" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          {/* Mode switcher */}
          <ModeSwitcher
            mode={learningMode}
            onModeChange={setLearningMode}
            completedCount={Object.values(dictationSession.results).filter(r => r.checked || r.skipped).length}
            totalCount={bilingualSegments.length}
            dictationProgressPct={dictationStats.progressPct}
            dictationProcessedCount={dictationStats.processedCount}
            dictationGoodCount={dictationStats.goodCount}
          />

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {learningMode === 'bilingual' ? (
              <TranscriptViewer
                lessonId={parseInt(id)}
                videoRef={playerWrapperRef as React.RefObject<any>}
                onSegmentClick={(startTimeMs) => {
                  const timeInSeconds = startTimeMs / 1000
                  sendPlayerCommand('seekTo', [timeInSeconds, true])
                  setTimeout(() => {
                    sendPlayerCommand('playVideo')
                    setIsPlaying(true)
                  }, 100)
                }}
              />
            ) : (
              <DictationMode
                segments={bilingualSegments}
                iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>}
                session={dictationSession}
                onSessionUpdate={setDictationSession}
                lessonId={id}
                onActiveSegmentChange={setDictationActiveSegmentIdx}
                onStatsChange={setDictationStats}
              />
            )}
          </div>
        </div>

        {/* Col 2: Practice area ends here */}
      </div>
    </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1a1a2e] dark:text-gray-100">Cài đặt</h2>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400 text-sm">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">Ngôn ngữ dịch</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1a1a1a] text-sm bg-white dark:bg-[#1a1a1a]">
                  <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">🇻🇳 Tiếng Việt</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              {[
                { label: 'Tự động hiển thị từ', value: autoReveal, setter: setAutoReveal },
                { label: 'Hiển thị Chú giải', value: showCaption, setter: setShowCaption },
                { label: 'Hiệu ứng âm thanh', value: soundEffect, setter: setSoundEffect },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                  <button
                    onClick={() => setter(!value)}
                    className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                    style={{ backgroundColor: value ? '#22c55e' : '#4b5563' }}>
                    <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                      style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowSettings(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-[#1a1a1a] hover:opacity-90">Lưu</button>
              <button onClick={() => setShowSettings(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShortcutsDraft({ ...shortcutBindings })
            setOpenShortcutDropdown(null)
            setShowShortcuts(false)
          }}
        >
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-[#1a1a2e] dark:text-gray-100">Phím tắt</h2>
              <button
                onClick={() => {
                  setShortcutsDraft({ ...shortcutBindings })
                  setOpenShortcutDropdown(null)
                  setShowShortcuts(false)
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-400 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs mb-4 text-gray-600 dark:text-gray-400">Sử dụng các phím tắt này để điều khiển nhanh việc phát và thao tác</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHORTCUT_MODAL_ROWS.map(({ action, label }) => (
                <ShortcutDropdown
                  key={action}
                  fieldId={action}
                  label={label}
                  options={SHORTCUT_OPTION_LIST[action]}
                  value={shortcutsDraft[action]}
                  onChange={(v) => setShortcutsDraft((d) => ({ ...d, [action]: v }))}
                  openId={openShortcutDropdown}
                  onOpenChange={setOpenShortcutDropdown}
                />
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  const next = normalizeShortcuts(shortcutsDraft)
                  setShortcutBindings(next)
                  try {
                    localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(next))
                  } catch {
                    /* ignore */
                  }
                  setOpenShortcutDropdown(null)
                  setShowShortcuts(false)
                }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-[#1a1a1a] hover:opacity-90"
              >
                Lưu
              </button>
              <button
                onClick={() => {
                  setShortcutsDraft({ ...shortcutBindings })
                  setOpenShortcutDropdown(null)
                  setShowShortcuts(false)
                }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
