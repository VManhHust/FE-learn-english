'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { axiosInstance } from '@/lib/auth/authClient'

interface Lesson {
  id: number
  title: string
  youtubeId?: string
  level: string
}

interface Segment {
  index: number
  start: number
  duration: number
  text: string
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
  const [hideMedia, setHideMedia] = useState(false)
  const [hideTranscript, setHideTranscript] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string[]>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [segmentMasks, setSegmentMasks] = useState<Record<number, boolean[]>>({})
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
    Promise.all([
      axiosInstance.get<Lesson>(`/api/lessons/${id}`),
      axiosInstance.get<Segment[]>(`/api/lessons/${id}/transcript`)
    ]).then(([lessonRes, transcriptRes]) => {
      setLesson(lessonRes.data)
      setSegments(transcriptRes.data)
      setSegmentMasks(buildMasks(transcriptRes.data, difficulty))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (segments.length > 0) {
      setSegmentMasks(buildMasks(segments, difficulty))
      setAnswers({})
      setRevealed({})
    }
  }, [difficulty, segments, buildMasks])

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
    if (currentIdx < segments.length - 1) setCurrentIdx(i => i + 1)
  }

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1)
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b text-xs" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
        <Link href="/dashboard/topics" className="hover:underline">Topics</Link>
        <span>›</span>
        <span className="hover:underline cursor-pointer">Movie short clip</span>
        <span>›</span>
        <span className="font-medium truncate max-w-xs" style={{ color: '#c8a84b' }}>{lesson.title}</span>
        <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded text-white"
          style={{ backgroundColor: LEVEL_COLORS[lesson.level] ?? '#6b7280' }}>
          {lesson.level}
        </span>
        <div className="ml-auto flex gap-4">
          <button onClick={() => setHideMedia(!hideMedia)} className="flex items-center gap-1 hover:text-gray-800">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {hideMedia ? 'Hiện Media' : 'Ẩn Media'}
          </button>
          <button onClick={() => setHideTranscript(!hideTranscript)} className="flex items-center gap-1 hover:text-gray-800">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            {hideTranscript ? 'Hiện transcript' : 'Ẩn transcript'}
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Col 1: Video */}
        <div className="flex flex-col gap-4 p-5 overflow-y-auto" style={{ width: 380, borderRight: '1px solid #e5e7eb', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: '#374151' }}>Video</span>
            <span className="text-xs flex items-center gap-1" style={{ color: '#6b7280' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {currentSegment ? `${Math.floor(currentSegment.start / 60)}:${String(Math.floor(currentSegment.start % 60)).padStart(2, '0')}` : '0:00'}
            </span>
          </div>

          {!hideMedia && lesson.youtubeId && (
            <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #3b82f6' }}>
              <iframe
                width="100%"
                height="200"
                src={`https://www.youtube.com/embed/${lesson.youtubeId}?enablejsapi=1`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="text-xs font-semibold" style={{ color: '#374151' }}>Điều khiển</div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1a1a2e' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Bắt đầu
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: '1.5px solid #e5e7eb', color: '#374151' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              Phát lại
            </button>
          </div>

          <div className="flex justify-center pt-2">
            <span className="text-6xl">🐦</span>
          </div>
        </div>

        {/* Col 2: Practice area */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ borderRight: '1px solid #e5e7eb' }}>
          {/* Difficulty tabs */}
          <div className="flex items-center justify-center gap-1 px-6 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize"
                style={{
                  backgroundColor: difficulty === d ? '#1a1a2e' : 'transparent',
                  color: difficulty === d ? '#fff' : '#6b7280',
                }}
              >
                {d === 'easy' ? 'Easy' : d === 'normal' ? 'Normal' : 'Hard'}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-2 border-b" style={{ borderColor: '#e5e7eb' }}>
            <button onClick={handlePrev} disabled={currentIdx === 0}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30">
              ‹
            </button>
            <div className="flex items-center gap-3">
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <button onClick={handleNext} disabled={currentIdx === segments.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30">
                ›
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#6b7280' }}>1x</span>
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Word input area */}
          <div className="flex-1 overflow-y-auto p-6">
            {segments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#9ca3af' }}>Không có transcript cho video này</p>
              </div>
            ) : currentSegment ? (
              <div className="space-y-6">
                <p className="text-sm" style={{ color: '#6b7280' }}>Gõ những gì bạn nghe được:</p>

                <div className="flex flex-wrap gap-2 items-center">
                  {currentWords.map((word, wi) => {
                    const isMasked = currentMasks[wi] && !isRevealed
                    const userVal = currentAnswers[wi] || ''
                    const isCorrect = userVal.trim().toLowerCase() === word.toLowerCase()

                    if (!isMasked) {
                      return (
                        <span key={wi} className="text-sm px-2 py-1 rounded" style={{ color: '#374151' }}>
                          {word}
                        </span>
                      )
                    }

                    return (
                      <input
                        key={wi}
                        ref={el => { inputRefs.current[wi] = el }}
                        type="text"
                        value={userVal}
                        onChange={(e) => handleWordInput(currentSegment.index, wi, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            const next = inputRefs.current.slice(wi + 1).find(Boolean)
                            next?.focus()
                          }
                        }}
                        className="text-sm px-2 py-1 rounded text-center"
                        style={{
                          border: `1.5px solid ${userVal ? (isCorrect ? '#22c55e' : '#ef4444') : '#d1d5db'}`,
                          outline: 'none',
                          width: Math.max(60, word.length * 10) + 'px',
                          backgroundColor: userVal && isCorrect ? '#f0fdf4' : '#fff',
                        }}
                        placeholder={'_'.repeat(Math.min(word.length, 6))}
                      />
                    )
                  })}
                </div>

                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  Gợi ý: Dùng <kbd className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: '#f3f4f6' }}>Space</kbd> để chuyển sang từ tiếp theo và{' '}
                  <kbd className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: '#f3f4f6' }}>Backspace</kbd> để quay lại từ trước
                </p>

                <div className="space-y-2">
                  <button
                    onClick={handleRevealAll}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Hiện tất cả từ
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIdx === segments.length - 1}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                  >
                    Tiếp theo ›
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Col 3: Bảng chép */}
        {!hideTranscript && (
          <div className="flex flex-col overflow-hidden" style={{ width: 260, flexShrink: 0 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <span className="text-sm font-semibold" style={{ color: '#374151' }}>Bảng chép</span>
              <span className="text-sm font-semibold" style={{ color: '#3b4fd8' }}>{progress}%</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {segments.map((seg, i) => {
                const isActive = i === currentIdx
                const isSegRevealed = !!revealed[seg.index]
                const segAnswers = answers[seg.index] || []
                const masks = segmentMasks[seg.index] || []
                const words = tokenize(seg.text)
                const allCorrect = words.every((w, wi) => {
                  if (!masks[wi]) return true
                  return (segAnswers[wi] || '').trim().toLowerCase() === w.toLowerCase()
                })

                return (
                  <button
                    key={seg.index}
                    onClick={() => setCurrentIdx(i)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{
                      border: `1.5px solid ${isActive ? '#3b82f6' : allCorrect && segAnswers.length ? '#22c55e' : '#e5e7eb'}`,
                      backgroundColor: isActive ? '#eff6ff' : '#fff',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: '#9ca3af' }}>#{seg.index}</span>
                      <div className="flex gap-1">
                        <span className="text-xs" style={{ color: '#9ca3af' }}>✏️</span>
                        <span className="text-xs" style={{ color: '#9ca3af' }}>△</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
                      {isSegRevealed
                        ? seg.text
                        : words.map((w, wi) => masks[wi] ? '●●●' : w).join(' ')
                      }
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
