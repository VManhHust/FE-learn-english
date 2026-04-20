'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { axiosInstance } from '@/lib/auth/authClient'
import LessonModeModal from '@/components/lesson/LessonModeModal'

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
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444',
}

const SLUG_TO_TITLE: Record<string, string> = {
  'movie-short-clip': 'Movie short clip',
  'daily-conversation': 'Daily English Conversation',
  'learning-resource': 'Learning resources',
}

const SLUG_TO_API: Record<string, string> = {
  'movie-short-clip': '/api/lessons/movie-short-clip',
  'daily-conversation': '/api/lessons/daily-conversation',
  'learning-resource': '/api/lessons/learning-resource',
}

function formatViews(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

function LessonCard({ lesson, onSelect }: { lesson: Lesson; onSelect: (l: Lesson) => void }) {
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  
  const thumbnail = lesson.youtubeId 
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail
  
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col border border-gray-200 dark:border-[#2e3142]"
      onClick={() => onSelect(lesson)}
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
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('viewCount')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const title = SLUG_TO_TITLE[slug] || slug
  const apiEndpoint = SLUG_TO_API[slug]

  useEffect(() => {
    if (!apiEndpoint) {
      setError('Chủ đề không tồn tại')
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    axiosInstance.get<PageResponse>(apiEndpoint, {
      params: { page, size: 20, sortBy, sortDir: 'desc' }
    })
      .then((res) => {
        setLessons(res.data.content)
        setTotalElements(res.data.totalElements)
      })
      .catch((err) => {
        console.error(err)
        setError(err.response?.data || 'Không thể tải dữ liệu')
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
      {selectedLesson && (
        <LessonModeModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
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
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
        <div className="flex items-center gap-2 mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Bộ lọc</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm bài học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border border-gray-200 dark:border-[#2e3142] outline-none bg-white dark:bg-[#252836] text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <select
              value={levelFilter || ''}
              onChange={(e) => setLevelFilter(e.target.value || null)}
              className="pl-10 pr-8 py-2.5 rounded-lg text-sm appearance-none cursor-pointer border border-gray-200 dark:border-[#2e3142] outline-none bg-white dark:bg-[#252836] text-gray-900 dark:text-gray-100"
              style={{ minWidth: '160px' }}
            >
              <option value="">Tất cả độ khó</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>
            <svg 
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="currentColor"
            >
              <path d="M6 8L1 3h10z" />
            </svg>
          </div>

          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M3 6h18M7 12h10M10 18h4" />
            </svg>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg text-sm appearance-none cursor-pointer border border-gray-200 dark:border-[#2e3142] outline-none bg-white dark:bg-[#252836] text-gray-900 dark:text-gray-100"
              style={{ minWidth: '180px' }}
            >
              <option value="viewCount">Tất cả trạng thái</option>
              <option value="createdAt">Mới nhất</option>
            </select>
            <svg 
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="currentColor"
            >
              <path d="M6 8L1 3h10z" />
            </svg>
          </div>
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
            <LessonCard key={lesson.id} lesson={lesson} onSelect={setSelectedLesson} />
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
