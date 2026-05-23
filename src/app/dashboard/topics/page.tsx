'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/auth/authClient'
import { topicsI18n } from '@/lib/i18n/topics'
import { extra } from '@/lib/i18n/dashboard'

interface Lesson {
  id: number
  title: string
  thumbnail: string | null
  duration: string
  level: string
  viewCount: number
  source: string
  hasDictation: boolean
  hasShadowing: boolean
  youtubeId?: string
  youtubeUrl?: string
  completionPercentage?: number
}

interface Topic {
  id: number
  name: string
  slug: string
  lessonCount: number
  previewLessons?: Lesson[]
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444',
}

const TAG_FILTERS = [
  'Movie short clip', 'Daily English Conversation', 'Learning resources',
  'Listening Time (Shadowing)', 'IELTS Listening', 'US UK songs',
  'TOEIC Listening', 'Entertainment', 'BBC learning english',
  'VOA Learning English', 'Toefl Listening', 'Science and Facts',
  'Fairy Tales', 'IPA', 'News', 'Vietnam Today', 'TED', 'Travel vlog',
  'Animals and wildlife', 'Business English',
]

const TAG_TO_SLUG: Record<string, string> = {
  'Movie short clip': 'movie-short-clip',
  'Daily English Conversation': 'daily-conversation',
  'Learning resources': 'learning-resource',
}

function formatViews(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

function LessonCard({ lesson, onSelect }: { lesson: Lesson; onSelect?: (l: Lesson) => void }) {
  const router = useRouter()
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  const emojis = ['🎬', '📚', '🎵', '🌍']
  const thumbnail = lesson.youtubeId
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail

  const handleClick = () => {
    if (onSelect) {
      onSelect(lesson)
    } else {
      router.push(`/dashboard/learn/dictation/${lesson.id}`)
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col border border-gray-200 dark:border-[#1a1a1a] shadow-sm"
      style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
      onClick={handleClick}
    >
      <div className="relative flex-shrink-0" style={{ backgroundColor: bg, height: 120 }}>
        {thumbnail ? (
          <img src={thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            {emojis[lesson.id % emojis.length]}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H5v-2a7 7 0 0 1 14 0v2h-2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/>
            </svg>
            {formatViews(lesson.viewCount)}
          </span>
        </div>
        <div
          className="absolute top-2 right-2 text-white text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: LEVEL_COLORS[lesson.level] ?? '#6b7280' }}
        >
          {lesson.level}
        </div>
        {lesson.source && (
          <div className="absolute bottom-2 left-2">
            <span className="text-white text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: '#ef4444' }}>
              {lesson.source}
            </span>
          </div>
        )}
        {lesson.duration && (
          <div className="absolute bottom-2 right-2">
            <span className="text-white text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              {lesson.duration}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-[#1a1a1a] flex flex-col flex-1 relative" style={{ minHeight: 72 }}>
        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1 text-gray-900 dark:text-gray-100">
          {lesson.title}
        </p>
        {lesson.completionPercentage === 100 && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ backgroundColor: 'rgba(34, 197, 94, 0.9)', color: 'white' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Hoàn thành
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const LEVEL_BADGES: { level: string; color: string; bg: string; darkBg: string; label: string }[] = [
  { level: 'A1', color: '#16a34a', bg: '#dcfce7', darkBg: '#14532d', label: 'A1 · Sơ cấp' },
  { level: 'A2', color: '#2563eb', bg: '#dbeafe', darkBg: '#1e3a5f', label: 'A2 · Cơ bản' },
  { level: 'B1', color: '#d97706', bg: '#fef3c7', darkBg: '#451a03', label: 'B1 · Trung cấp' },
  { level: 'B2', color: '#7c3aed', bg: '#ede9fe', darkBg: '#2e1065', label: 'B2 · Khá' },
  { level: 'C1', color: '#dc2626', bg: '#fee2e2', darkBg: '#450a0a', label: 'C1 · Nâng cao' },
]

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [levelFilters, setLevelFilters] = useState<string[]>([])
  const [levelOpen, setLevelOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const levelRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (levelRef.current && !levelRef.current.contains(e.target as Node)) {
        setLevelOpen(false)
      }
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setTagOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    axiosInstance.get<Topic[]>('/api/topics')
      .then((res) => setTopics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filterLessons = (lessons: Lesson[]) => {
    if (levelFilters.length === 0) return lessons
    return lessons.filter((l) => levelFilters.includes(l.level))
  }

  const filteredTopics = activeTags.length > 0
    ? topics.filter((t) => activeTags.includes(t.name))
    : topics

  return (
    <div className="bg-[#f5f3ef] dark:bg-[#0f0e0c] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Level dropdown */}
        <div className="relative" ref={levelRef}>
          <button
            onClick={() => { setLevelOpen(!levelOpen); setTagOpen(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-[#f5f3ef] dark:bg-[#1a1917] border-gray-200 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
            style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
          >
            <span>
              {levelFilters.length === 0 ? 'Cấp độ' : `Cấp độ (${levelFilters.length})`}
            </span>
            {levelFilters.length > 0 && (
              <span className="flex items-center gap-0.5">
                {levelFilters.slice(0, 3).map(level => (
                  <span key={level} className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === level)?.color }} />
                ))}
              </span>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${levelOpen ? 'rotate-180' : ''}`}>
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {levelOpen && (
            <div className="absolute left-0 top-11 w-48 rounded-xl shadow-lg py-1 z-50 bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a]">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chọn cấp độ</span>
                {levelFilters.length > 0 && (
                  <button
                    onClick={() => setLevelFilters([])}
                    className="text-xs hover:underline"
                    style={{ color: '#d4a853' }}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {LEVEL_BADGES.map(({ level, color, bg, label }) => {
                const isSelected = levelFilters.includes(level)
                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (isSelected) {
                        setLevelFilters(levelFilters.filter(l => l !== level))
                      } else {
                        setLevelFilters([...levelFilters, level])
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'border-gray-300 dark:border-gray-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                      style={isSelected ? { borderColor: color, backgroundColor: color } : {}}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>
                      {level[0]}
                    </span>
                    <span className={isSelected ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Topic/Tag dropdown */}
        <div className="relative" ref={tagRef}>
          <button
            onClick={() => { setTagOpen(!tagOpen); setLevelOpen(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-[#f5f3ef] dark:bg-[#1a1917] border-gray-200 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
            style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
          >
            <span>{activeTags.length === 0 ? 'Chủ đề' : `Chủ đề (${activeTags.length})`}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${tagOpen ? 'rotate-180' : ''}`}>
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {tagOpen && (
            <div className="absolute left-0 top-11 w-64 rounded-xl shadow-lg py-1 z-50 bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#f5f3ef] dark:bg-[#1a1917]">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chọn chủ đề</span>
                {activeTags.length > 0 && (
                  <button
                    onClick={() => setActiveTags([])}
                    className="text-xs hover:underline"
                    style={{ color: '#d4a853' }}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {topics.map((topic) => {
                const isSelected = activeTags.includes(topic.name)
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      if (isSelected) {
                        setActiveTags(activeTags.filter(t => t !== topic.name))
                      } else {
                        setActiveTags([...activeTags, topic.name])
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors`}
                      style={isSelected ? { borderColor: '#3b4fd8', backgroundColor: '#3b4fd8' } : { borderColor: '#9ca3af' }}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={isSelected ? 'font-semibold text-[#3b4fd8] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}>
                      {topic.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Active filter badges */}
        {(levelFilters.length > 0 || activeTags.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {levelFilters.map(level => {
              const badge = LEVEL_BADGES.find(l => l.level === level)
              return (
                <span
                  key={level}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: badge?.color }}
                >
                  {level}
                  <button onClick={() => setLevelFilters(levelFilters.filter(l => l !== level))} className="ml-1 hover:opacity-70">✕</button>
                </span>
              )
            })}
            {activeTags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900">
                {tag}
                <button onClick={() => setActiveTags(activeTags.filter(t => t !== tag))} className="ml-1 hover:opacity-70">✕</button>
              </span>
            ))}
            <button
              onClick={() => { setLevelFilters([]); setActiveTags([]) }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-10">
          {filteredTopics.map((topic) => {
            const filtered = filterLessons(topic.previewLessons ?? [])
            if (levelFilters.length > 0 && filtered.length === 0) return null
            return (
            <section key={topic.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {topic.name}{' '}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                    ({topic.lessonCount} {topicsI18n.lessonCount})
                  </span>
                </h2>
                <Link href={`/dashboard/topics/${topic.slug}`} className="text-sm font-medium flex items-center gap-1" style={{ color: '#3b4fd8' }}>
                  {topicsI18n.viewAll} &#8250;
                </Link>
              </div>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden animate-pulse border border-gray-200 dark:border-[#1a1a1a]">
                      <div className="h-28 bg-gray-200 dark:bg-[#1a1a1a]" />
                      <div className="p-3 space-y-2 bg-white dark:bg-[#0a0a0a]">
                        <div className="h-3 rounded bg-gray-200 dark:bg-[#1a1a1a]" />
                        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-[#1a1a1a]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            )
          })}
        </div>
      )}

      </div>
    </div>
  )
}
