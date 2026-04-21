'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { axiosInstance } from '@/lib/auth/authClient'
import ModeSwitcher from '@/components/learning/ModeSwitcher'
import BilingualMode from '@/components/learning/BilingualMode'
import DictationMode from '@/components/learning/DictationMode'
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

  // Video playing state
  const [isPlaying, setIsPlaying] = useState(false)

  // Learning mode (bilingual / dictation)
  const [learningMode, setLearningMode] = useState<LearningMode>('bilingual')
  const [bilingualSegments, setBilingualSegments] = useState<BilingualSegment[]>([])
  const [dictationSession, setDictationSession] = useState<DictationSession>({
    results: {}, currentIdx: 0, submode: 'full',
  })

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
      })
      .catch((err) => {
        if (err?.response?.status === 503) {
          setTranscriptError('Không thể tải transcript, vui lòng thử lại sau')
        }
      })
      .finally(() => { transcriptDone = true; checkDone() })

    axiosInstance.get<BilingualSegment[]>(`/api/lessons/${id}/bilingual`)
      .then(res => setBilingualSegments(res.data))
      .catch(() => {}) // bilingual is optional, don't block loading
  }, [id])

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
      setIsPlayingSegment(false) // Không kích hoạt auto-pause khi phát toàn bộ
    }
  }

  const handleReplay = () => {
    sendPlayerCommand('seekTo', [0, true])
    setTimeout(() => {
      sendPlayerCommand('playVideo')
      setIsPlaying(true)
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

  // Request time updates from YouTube
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      sendPlayerCommand('getVideoData')
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'getCurrentTime', args: [] }),
        'https://www.youtube.com'
      )
    }, 250)
    return () => clearInterval(interval)
  }, [isPlaying])

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
    <div className="flex flex-col bg-app-bg-cream dark:bg-[#0f1117]" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b text-xs bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-600 dark:text-gray-400">
        <Link href="/dashboard/topics" className="hover:underline">Topics</Link>
        <span>›</span>
        <span className="hover:underline cursor-pointer">Movie short clip</span>
        <span>›</span>
        <span className="font-medium truncate max-w-xs text-app-accent-gold">{lesson.title}</span>
        <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded text-white"
          style={{ backgroundColor: LEVEL_COLORS[lessonLevel] ?? '#6b7280' }}>
          {lessonLevel}
        </span>
        <div className="ml-auto flex gap-4">
          <button onClick={handleToggleMedia} className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {hideMedia ? 'Hiện Media' : 'Ẩn Media'}
          </button>
        </div>
      </div>

      {/* 3-column layout with padding and white panels */}
      <div className="flex flex-1 overflow-hidden gap-3 p-3 bg-[#f0ede8] dark:bg-[#0f1117]">

        {/* Col 1: Video */}
        <div className="flex flex-col gap-4 p-5 overflow-y-auto rounded-xl bg-white dark:bg-[#1a1d27]" style={{ width: 360, flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Video</span>
            <span className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {currentSegment ? `${Math.floor(currentSegment.start / 60)}:${String(Math.floor(currentSegment.start % 60)).padStart(2, '0')}` : '0:00'}
            </span>
          </div>

          {youtubeId && (
            <div className={`rounded-xl overflow-hidden border-2 border-blue-500 dark:border-blue-600 ${hideMedia ? 'hidden' : ''}`}>
              <iframe
                ref={iframeRef}
                id="yt-player"
                width="100%"
                height="200"
                src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleIframeLoad}
              />
            </div>
          )}

          {hideMedia && (
            <div className="rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex items-center justify-center" style={{ height: 200 }}>
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 opacity-50">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <p className="text-sm">Media đã ẩn</p>
                <p className="text-xs mt-1">Video vẫn đang phát</p>
              </div>
            </div>
          )}

          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Điều khiển</div>
          
          {/* Navigation + Settings on one row */}
          <div className="flex items-center justify-between">
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
              <button onClick={() => setShowShortcuts(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836]" title="Phím tắt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-200">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePlay}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-[#2e3142] hover:opacity-90">
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
                  Bắt đầu
                </>
              )}
            </button>
            <button
              onClick={handleReplay}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-[#2e3142] hover:opacity-90">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              Phát lại
            </button>
          </div>
        </div>

        {/* Col 2: Mode switcher + content */}
        <div className="flex flex-col flex-1 overflow-hidden rounded-xl bg-white dark:bg-[#1a1d27]">
          {/* Mode switcher */}
          <ModeSwitcher
            mode={learningMode}
            onModeChange={setLearningMode}
            completedCount={Object.values(dictationSession.results).filter(r => r.checked || r.skipped).length}
            totalCount={bilingualSegments.length}
          />

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {learningMode === 'bilingual' ? (
              <BilingualMode segments={bilingualSegments} />
            ) : (
              <DictationMode
                segments={bilingualSegments}
                iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>}
                session={dictationSession}
                onSessionUpdate={setDictationSession}
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
          <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1a1a2e] dark:text-gray-100">Cài đặt</h2>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836] text-gray-400 text-sm">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">Ngôn ngữ dịch</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e3142] text-sm bg-white dark:bg-[#252836]">
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
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-[#2e3142] hover:opacity-90">Lưu</button>
              <button onClick={() => setShowSettings(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#252836] hover:bg-gray-50 dark:hover:bg-[#2e3142]">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-[#1a1d27] rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-[#1a1a2e] dark:text-gray-100">Phím tắt</h2>
              <button onClick={() => setShowShortcuts(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#252836] text-gray-400 text-sm">✕</button>
            </div>
            <p className="text-xs mb-4 text-gray-600 dark:text-gray-400">Sử dụng các phím tắt này để điều khiển nhanh việc phát và thao tác</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Phát / Dừng', key: 'Tab' },
                { label: 'Tiếp theo', key: 'Ctrl/Command + →' },
                { label: 'Trước', key: 'Ctrl/Command + ←' },
                { label: 'Phát lại', key: '`' },
                { label: 'Bắt đầu / Dừng ghi âm', key: 'Shift + `' },
                { label: 'Phát lại ghi âm', key: 'Space' },
                { label: 'Nộp bài', key: 'Enter' },
              ].map(({ label, key }) => (
                <div key={label}>
                  <p className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</p>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e3142] text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-[#252836]">
                    <span>{key}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowShortcuts(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-[#2e3142] hover:opacity-90">Lưu</button>
              <button onClick={() => setShowShortcuts(false)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#252836] hover:bg-gray-50 dark:hover:bg-[#2e3142]">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
