'use client'

import { RefObject, useEffect, useRef, useState } from 'react'
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

interface DictationModeProps {
  segments: BilingualSegment[]
  iframeRef: RefObject<HTMLIFrameElement>
  session: DictationSession
  onSessionUpdate: (s: DictationSession) => void
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

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
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full"
          style={{
            backgroundColor: '#c9a84c',
            height: playing ? `${8 + Math.sin(i * 0.8) * 8}px` : '4px',
            opacity: playing ? 0.7 + Math.sin(i * 0.5) * 0.3 : 0.3,
            animation: playing ? `wave ${0.8 + (i % 3) * 0.2}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function DictationMode({
  segments,
  iframeRef,
  session,
  onSessionUpdate,
}: DictationModeProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [submode, setSubmode] = useState<DictationSubmode>('full')
  const [userInput, setUserInput] = useState('')
  const [inlineAnswers, setInlineAnswers] = useState<string[]>([])
  const [wordMasks, setWordMasks] = useState<boolean[]>([])
  const [checkResult, setCheckResult] = useState<WordResult[] | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const speedRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentSeg = segments[currentIdx] ?? null
  const totalCount = segments.length

  const processedCount = Object.values(session.results).filter(
    r => r.checked || r.skipped
  ).length
  const goodCount = Object.values(session.results).filter(r => r.isGood).length
  const progressPct = calculateProgress(processedCount, totalCount)
  const allDone = totalCount > 0 && processedCount >= totalCount

  // Build masks when segment or submode changes
  useEffect(() => {
    if (!currentSeg) return
    if (submode === 'fill-blank') {
      setWordMasks(generateMasks(currentSeg.text))
    } else {
      setWordMasks([])
    }
    setUserInput('')
    setInlineAnswers([])
    setCheckResult(null)
    setIsPlaying(false)
  }, [currentIdx, submode])

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
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePlay = () => {
    if (!currentSeg) return
    if (isPlaying) {
      sendCommand(iframeRef, 'pauseVideo')
      setIsPlaying(false)
    } else {
      sendCommand(iframeRef, 'seekTo', [currentSeg.startTime, true])
      setTimeout(() => sendCommand(iframeRef, 'playVideo'), 100)
      setIsPlaying(true)
    }
  }

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate)
    setShowSpeedMenu(false)
    sendCommand(iframeRef, 'setPlaybackRate', [rate])
  }

  const goToSegment = (idx: number) => {
    setCurrentIdx(idx)
    setUserInput('')
    setInlineAnswers([])
    setCheckResult(null)
    setIsPlaying(false)
    sendCommand(iframeRef, 'pauseVideo')
  }

  const handleCheck = () => {
    if (!currentSeg) return
    const words = tokenize(currentSeg.text).filter(w => /[\w']/.test(w))

    let accuracy: number
    let result: WordResult[]

    if (submode === 'full') {
      result = compareWords(userInput, words)
      const correct = result.filter(r => r.correct).length
      accuracy = Math.round((correct / Math.max(words.length, 1)) * 100)
    } else {
      // fill-blank: only check masked positions
      const tokens = tokenize(currentSeg.text)
      result = tokens.map((token, i) => ({
        word: token,
        userWord: wordMasks[i] ? (inlineAnswers[i] ?? '') : token,
        correct: wordMasks[i]
          ? (inlineAnswers[i] ?? '').trim().toLowerCase() === token.toLowerCase()
          : true,
      }))
      accuracy = scoreFillBlank(wordMasks, inlineAnswers, tokens)
    }

    setCheckResult(result)

    const updated: DictationSession = {
      ...session,
      results: {
        ...session.results,
        [currentSeg.segmentIndex]: {
          segmentIndex: currentSeg.segmentIndex,
          checked: true,
          skipped: false,
          accuracy,
          isGood: accuracy >= 80,
        },
      },
    }
    onSessionUpdate(updated)
  }

  const handleSkip = () => {
    if (!currentSeg) return
    const updated: DictationSession = {
      ...session,
      results: {
        ...session.results,
        [currentSeg.segmentIndex]: {
          segmentIndex: currentSeg.segmentIndex,
          checked: false,
          skipped: true,
          accuracy: 0,
          isGood: false,
        },
      },
    }
    onSessionUpdate(updated)
    if (currentIdx < segments.length - 1) goToSegment(currentIdx + 1)
  }

  const handleReset = () => {
    onSessionUpdate({ results: {}, currentIdx: 0, submode })
    goToSegment(0)
  }

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có nội dung để luyện tập</p>
      </div>
    )
  }

  // Summary screen
  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-100">Hoàn thành!</h2>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-[#c9a84c]">{progressPct}%</p>
            <p className="text-xs text-gray-400 mt-1">Tiến độ</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">{goodCount}</p>
            <p className="text-xs text-gray-400 mt-1">Câu đúng ≥80%</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-300">{totalCount}</p>
            <p className="text-xs text-gray-400 mt-1">Tổng số câu</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#1a1a2e] bg-[#c9a84c] hover:bg-[#b8973b] transition-colors"
        >
          Làm lại
        </button>
      </div>
    )
  }

  const tokens = currentSeg ? tokenize(currentSeg.text) : []

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header card */}
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#252836] flex items-center justify-center flex-shrink-0 text-lg">
            🎧
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              Nghe chép chính tả – {totalCount} câu
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Nghe audio từng câu và gõ lại những gì bạn nghe được. Hệ thống sẽ chấm điểm từng từ và chỉ ra lỗi sai.
            </p>
            <div className="flex gap-2 mt-3">
              {(['full', 'fill-blank'] as DictationSubmode[]).map(sm => (
                <button
                  key={sm}
                  onClick={() => setSubmode(sm)}
                  className="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
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
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] flex items-center gap-4">
        <ProgressCircle pct={progressPct} />
        <div className="w-px h-10 bg-gray-200 dark:bg-[#2e3142]" />
        <div className="flex gap-6 flex-1">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{processedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Đã hoàn thành</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{goodCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Câu đúng ≥80%</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tổng số câu</p>
          </div>
        </div>
      </div>

      {/* Audio player */}
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
        <div className="flex items-center gap-3">
          {/* Play button */}
          <button
            onClick={handlePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ backgroundColor: '#c9a84c' }}
          >
            {isPlaying ? (
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
            <Waveform playing={isPlaying} />
          </div>

          {/* Câu X */}
          <span className="text-xs text-gray-400 flex-shrink-0">
            Câu {currentIdx + 1}
          </span>

          {/* Speed selector */}
          <div className="relative flex-shrink-0" ref={speedRef}>
            <button
              onClick={() => setShowSpeedMenu(v => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-gray-300 border border-[#3a3d4f] hover:border-[#c9a84c] transition-colors"
            >
              {playbackRate}x
              <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10z" />
              </svg>
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 bottom-full mb-1 z-50 rounded-xl shadow-xl p-2 bg-[#1a1d27] border border-[#2e3142] w-28">
                {SPEEDS.map(rate => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: playbackRate === rate ? 'rgba(201,168,76,0.15)' : 'transparent',
                      color: playbackRate === rate ? '#c9a84c' : '#9ca3af',
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Gõ lại những gì bạn vừa nghe
        </p>

        {submode === 'full' ? (
          /* Full dictation: textarea */
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Nhập câu bạn nghe được..."
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-[#252836] border border-gray-200 dark:border-[#3a3d4f] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#c9a84c] resize-none transition-colors"
          />
        ) : (
          /* Fill-blank: inline inputs */
          <div className="flex flex-wrap gap-x-1.5 gap-y-2 items-baseline min-h-[60px] p-2 rounded-lg bg-white dark:bg-[#252836] border border-gray-200 dark:border-[#3a3d4f]">
            {tokens.map((token, i) => {
              const isMasked = wordMasks[i]
              if (!isMasked) {
                return (
                  <span key={i} className="text-sm text-gray-700 dark:text-gray-200">{token}</span>
                )
              }
              return (
                <input
                  key={i}
                  type="text"
                  value={inlineAnswers[i] ?? ''}
                  onChange={e => {
                    const next = [...inlineAnswers]
                    next[i] = e.target.value
                    setInlineAnswers(next)
                  }}
                  className="text-sm text-center bg-transparent text-[#c9a84c] outline-none"
                  style={{
                    borderBottom: '1.5px solid #c9a84c',
                    width: Math.max(40, token.length * 9) + 'px',
                    padding: '1px 2px',
                  }}
                  placeholder={'_'.repeat(Math.min(token.length, 6))}
                />
              )
            })}
          </div>
        )}

        {/* Result display */}
        {checkResult && (
          <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1.5 items-baseline p-3 rounded-lg bg-gray-100 dark:bg-[#252836]">
            {checkResult.map((r, i) => (
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
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            Bỏ qua
          </button>
          <button
            onClick={handleCheck}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#c9a84c', color: '#1a1a2e' }}
          >
            Kiểm tra
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => currentIdx > 0 && goToSegment(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹ Câu trước
        </button>
        <span className="text-xs text-gray-500">
          {currentIdx + 1} / {totalCount}
        </span>
        <button
          onClick={() => currentIdx < segments.length - 1 && goToSegment(currentIdx + 1)}
          disabled={currentIdx === segments.length - 1}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Câu tiếp theo ›
        </button>
      </div>
    </div>
  )
}
