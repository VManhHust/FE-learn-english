'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/auth/authClient'

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
  youtubeUrl?: string
  youtubeId?: string
}

interface PageResponse {
  content: Lesson[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  topicName?: string
  topicId?: number
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444',
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Mới nhất' },
  { value: 'viewCount', label: 'Xem nhiều nhất' },
  { value: 'title', label: 'Tên A-Z' },
]

const LEVEL_BADGES = [
  { level: 'A1', color: '#16a34a', label: 'A1 · Sơ cấp' },
  { level: 'A2', color: '#2563eb', label: 'A2 · Cơ bản' },
  { level: 'B1', color: '#d97706', label: 'B1 · Trung cấp' },
  { level: 'B2', color: '#7c3aed', label: 'B2 · Khá' },
  { level: 'C1', color: '#dc2626', label: 'C1 · Nâng cao' },
]

function formatViews(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

function LessonCard({ lesson, onSelect }: { lesson: Lesson; onSelect: (l: Lesson) => void }) {
  const router = useRouter()
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  
  const thumbnail = lesson.youtubeId 
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail
  
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col border border-gray-200 dark:border-[#2e3142]"
      onClick={() => router.push(`/dashboard/learn/dictation/${lesson.id}`)}
    >
      <div className="relative flex-shrink-0" style={{ backgroundColor: bg, height: 140 }}>
        {thumbnail ? (
          <img src={thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🎬</div>
        )}
        <div className="absolute top-2 left-2">
          <span className="text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H5v-2a7 7 0 0 1 14 0v2h-2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z"/>
            </svg>
            {formatViews(lesson.viewCount)}
          </span>
        </div>
        <div className="absolute top-2 right-2 text-white text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: LEVEL_COLORS[lesson.level] ?? '#6b7280' }}>
          {lesson.level}
        </div>
        {lesson.source && (
          <div className="absolute bottom-2 left-2">
            <span className="text-white text-xs px-2 py-0.5 rounded font-medium bg-red-500">
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
      <div className="p-3 bg-white dark:bg-[#1a1d27] flex flex-col flex-1" style={{ minHeight: 72 }}>
        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1 text-[#1a1a2e] dark:text-gray-100">
          {lesson.title}
        </p>
        <div className="flex gap-3 text-xs mt-2 text-gray-600 dark:text-gray-400">
          {lesson.hasDictation && <span>Dictation &#9432;</span>}
          {lesson.hasShadowing && <span>Shadowing &#9432;</span>}
        </div>
      </div>
    </div>
  )
}

export default function TopicDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [topicName, setTopicName] = useState('')
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('viewCount')
  const [levelOpen, setLevelOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const levelRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (levelRef.current && !levelRef.current.contains(e.target as Node)) {
        setLevelOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const title = topicName || slug
  const apiEndpoint = `/api/topics/${slug}/lessons`

  useEffect(() => {
    setLoading(true)
    setError(null)
    axiosInstance.get<PageResponse>(apiEndpoint, {
      params: { page, size: 20, sortBy, sortDir: 'desc' }
    })
      .then((res) => {
        setLessons(res.data.content)
        setTotalElements(res.data.totalElements)
        if (res.data.topicName) setTopicName(res.data.topicName)
      })
      .catch((err) => {
        console.error(err)
        setError(err.response?.data?.message || 'Không thể tải dữ liệu')
      })
      .finally(() => setLoading(false))
  }, [apiEndpoint, page, sortBy])

  const filteredLessons = lessons.filter((l) => {
    const matchSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchLevel = !levelFilter || l.level === levelFilter
    return matchSearch && matchLevel
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="text-sm flex items-center gap-1 hover:underline text-gray-600 dark:text-gray-400"
        >
          &#8592; Quay về chủ đề
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-gray-100">{title}</h1>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
            Tổng số bài học: {totalElements}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm bài học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-[#2e3142] outline-none bg-white dark:bg-[#1a1d27] text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Level dropdown */}
        <div className="relative" ref={levelRef}>
          <button
            onClick={() => setLevelOpen(!levelOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <span>
              {levelFilter ? LEVEL_BADGES.find(l => l.level === levelFilter)?.label : 'Cấp độ'}
            </span>
            {levelFilter && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === levelFilter)?.color }} />
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${levelOpen ? 'rotate-180' : ''}`}>
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {levelOpen && (
            <div className="absolute left-0 top-11 w-48 rounded-xl shadow-lg py-1 z-50 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
              <button
                onClick={() => { setLevelFilter(null); setLevelOpen(false) }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#252836] ${!levelFilter ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Tất cả cấp độ
              </button>
              {LEVEL_BADGES.map(({ level, color, label }) => (
                <button
                  key={level}
                  onClick={() => { setLevelFilter(level); setLevelOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#252836]"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: color }}>
                    {level[0]}
                  </span>
                  <span style={{ color: levelFilter === level ? color : undefined }} className={levelFilter === level ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}>
                    {label}
                  </span>
                  {levelFilter === level && (
                    <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active filter badge */}
        {levelFilter && (
          <span
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === levelFilter)?.color }}
          >
            {levelFilter}
            <button onClick={() => setLevelFilter(null)} className="ml-1 hover:opacity-70">✕</button>
          </span>
        )}

        {/* Sort dropdown */}
        <div className="relative ml-auto" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M10 18h4" />
            </svg>
            <span>{SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? 'Sắp xếp'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`}>
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-11 w-48 rounded-xl shadow-lg py-1 z-50 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
              {SORT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setSortBy(value); setSortOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#252836]"
                >
                  <span className={sortBy === value ? 'font-semibold text-[#3b4fd8] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}>
                    {label}
                  </span>
                  {sortBy === value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b4fd8" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Lessons Grid */}
      {error ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold mb-2 text-red-500 dark:text-red-400">Có lỗi xảy ra</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}

      {filteredLessons.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-sm text-gray-400 dark:text-gray-500">Không tìm thấy bài học nào</p>
        </div>
      )}
    </div>
  )
}
