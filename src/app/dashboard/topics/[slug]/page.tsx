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
  completionPercentage?: number
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

const PROGRESS_FILTERS = [
  { value: 'completed', label: 'Hoàn thành', color: '#22c55e' },
  { value: 'in-progress', label: 'Đang làm', color: '#06b6d4' },
  { value: 'not-started', label: 'Chưa làm', color: '#6b7280' },
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

function LessonCard({ lesson, onSelect }: { lesson: Lesson; onSelect?: (l: Lesson) => void }) {
  const router = useRouter()
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  
  const thumbnail = lesson.youtubeId 
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail
  
  // Debug log
  if (lesson.completionPercentage === 100) {
    console.log('Lesson completed:', lesson.id, lesson.title, lesson.completionPercentage)
  }
  
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105 flex flex-col border border-gray-200 dark:border-[#2e3142]"
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
      <div className="p-3 bg-white dark:bg-[#1a1d27] flex flex-col flex-1 relative" style={{ minHeight: 72 }}>
        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1 text-[#1a1a2e] dark:text-gray-100">
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
        {lesson.completionPercentage !== undefined && lesson.completionPercentage > 0 && lesson.completionPercentage < 100 && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ backgroundColor: 'rgba(6, 182, 212, 0.9)', color: 'white' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              Đang làm
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TopicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [topicName, setTopicName] = useState('')
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilters, setLevelFilters] = useState<string[]>([])
  const [progressFilters, setProgressFilters] = useState<string[]>([])
  const [levelOpen, setLevelOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const levelRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (levelRef.current && !levelRef.current.contains(e.target as Node)) {
        setLevelOpen(false)
      }
      if (progressRef.current && !progressRef.current.contains(e.target as Node)) {
        setProgressOpen(false)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
    axiosInstance.get<PageResponse>(apiEndpoint, {
      params: { page, size: 10, sortBy: 'viewCount', sortDir: 'desc' }
    })
      .then((res) => {
        setLessons(res.data.content)
        setTotalElements(res.data.totalElements)
        setTotalPages(res.data.totalPages)
        if (res.data.topicName) setTopicName(res.data.topicName)
      })
      .catch((err) => {
        console.error(err)
        setError(err.response?.data?.message || 'Không thể tải dữ liệu')
      })
      .finally(() => setLoading(false))
  }, [apiEndpoint, page])

  const filteredLessons = lessons.filter((l) => {
    const matchSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchLevel = levelFilters.length === 0 || levelFilters.includes(l.level)
    
    // Progress filter logic
    let matchProgress = true
    if (progressFilters.length > 0) {
      matchProgress = progressFilters.some(filter => {
        if (filter === 'completed') {
          return l.completionPercentage === 100
        } else if (filter === 'in-progress') {
          return l.completionPercentage !== undefined && l.completionPercentage > 0 && l.completionPercentage < 100
        } else if (filter === 'not-started') {
          return !l.completionPercentage || l.completionPercentage === 0
        }
        return false
      })
    }
    
    return matchSearch && matchLevel && matchProgress
  })

  return (
    <div className="bg-[#f5f0e8] dark:bg-[#0f0e0c] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/topics')}
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
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-[#2e3142] outline-none bg-[#f5f0e8] dark:bg-[#1a1917] text-gray-900 dark:text-gray-100 shadow-sm"
            style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
          />
        </div>

        {/* Level dropdown */}
        <div className="relative" ref={levelRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLevelOpen(!levelOpen)
              setProgressOpen(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-[#f5f0e8] dark:bg-[#1a1917] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
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
            <div className="absolute left-0 top-11 w-56 rounded-xl shadow-lg py-2 z-50 bg-[#f5f0e8] dark:bg-[#1a1917] border border-gray-200 dark:border-[#2e3142]">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#2e3142] flex items-center justify-between">
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
              {LEVEL_BADGES.map(({ level, color, label }) => {
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
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#252836]"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors`}
                      style={isSelected ? { borderColor: color, backgroundColor: color } : { borderColor: '#9ca3af' }}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: color }}>
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

        {/* Active filter badges */}
        {(levelFilters.length > 0 || progressFilters.length > 0) && (
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
                  <button 
                    onClick={() => setLevelFilters(levelFilters.filter(l => l !== level))} 
                    className="ml-1 hover:opacity-70"
                  >
                    ✕
                  </button>
                </span>
              )
            })}
            {progressFilters.map(filter => {
              const progressBadge = PROGRESS_FILTERS.find(f => f.value === filter)
              return (
                <span
                  key={filter}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: progressBadge?.color }}
                >
                  {progressBadge?.label}
                  <button 
                    onClick={() => setProgressFilters(progressFilters.filter(f => f !== filter))} 
                    className="ml-1 hover:opacity-70"
                  >
                    ✕
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* Progress dropdown */}
        <div className="relative ml-auto" ref={progressRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setProgressOpen(!progressOpen)
              setLevelOpen(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-[#f5f0e8] dark:bg-[#1a1917] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
            style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>
              {progressFilters.length === 0 ? 'Tiến độ' : `Tiến độ (${progressFilters.length})`}
            </span>
            {progressFilters.length > 0 && (
              <span className="flex items-center gap-0.5">
                {progressFilters.slice(0, 3).map(filter => {
                  const filterObj = PROGRESS_FILTERS.find(f => f.value === filter)
                  return (
                    <span key={filter} className="w-2 h-2 rounded-full" style={{ backgroundColor: filterObj?.color }} />
                  )
                })}
              </span>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${progressOpen ? 'rotate-180' : ''}`}>
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {progressOpen && (
            <div className="absolute right-0 top-11 w-48 rounded-xl shadow-lg py-2 z-50 bg-[#f5f0e8] dark:bg-[#1a1917] border border-gray-200 dark:border-[#2e3142]">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#2e3142] flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chọn tiến độ</span>
                {progressFilters.length > 0 && (
                  <button
                    onClick={() => setProgressFilters([])}
                    className="text-xs hover:underline"
                    style={{ color: '#d4a853' }}
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              {PROGRESS_FILTERS.map(({ value, label, color }) => {
                const isSelected = progressFilters.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => {
                      if (isSelected) {
                        setProgressFilters(progressFilters.filter(f => f !== value))
                      } else {
                        setProgressFilters([...progressFilters, value])
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#252836]"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors`}
                      style={isSelected ? { borderColor: color, backgroundColor: color } : { borderColor: '#9ca3af' }}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className={isSelected ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}>
                      {label}
                    </span>
                  </button>
                )
              })}
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
            className="mt-4 px-4 py-2 rounded-lg text-sm text-white hover:opacity-90"
            style={{ backgroundColor: '#d4a853' }}
          >
            Quay lại
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-t-transparent" style={{ borderColor: '#d4a853', borderTopColor: 'transparent' }} />
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

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Trước
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i
              } else if (page < 3) {
                pageNum = i
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i
              } else {
                pageNum = page - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'text-white'
                      : 'bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  style={page === pageNum ? { backgroundColor: '#d4a853' } : {}}
                >
                  {pageNum + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
    </div>
  )
}
