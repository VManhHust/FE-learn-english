'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/auth/authClient'
import { topicsI18n } from '@/lib/i18n/topics'
import { topicsI18n_en } from '@/lib/i18n/topics_en'
import { useLang } from '@/lib/i18n/LangProvider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

const LEVEL_BADGES_BASE = ['A1', 'A2', 'B1', 'B2', 'C1']
const LEVEL_COLORS_MAP: Record<string, string> = {
  A1: '#16a34a', A2: '#2563eb', B1: '#d97706', B2: '#7c3aed', C1: '#dc2626',
}

function formatViews(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

function LessonCard({ lesson, t }: { lesson: Lesson; t: typeof topicsI18n }) {
  const router = useRouter()
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  const thumbnail = lesson.youtubeId
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail

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
              {t.lessonCompleted}
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
              {t.lessonInProgress}
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
  const { lang } = useLang()
  const t = lang === 'en' ? topicsI18n_en : topicsI18n

  const LEVEL_BADGES = LEVEL_BADGES_BASE.map(level => ({
    level,
    color: LEVEL_COLORS_MAP[level],
    label: t[`level${level}` as keyof typeof t] as string,
  }))

  const PROGRESS_FILTERS = [
    { value: 'completed', label: t.completed, color: '#22c55e' },
    { value: 'in-progress', label: t.inProgress, color: '#06b6d4' },
    { value: 'not-started', label: t.notStarted, color: '#6b7280' },
  ]

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
        setError(err.response?.data?.message || t.errorTitle)
      })
      .finally(() => setLoading(false))
  }, [apiEndpoint, page])

  const filteredLessons = lessons.filter((l) => {
    const matchSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchLevel = levelFilters.length === 0 || levelFilters.includes(l.level)
    let matchProgress = true
    if (progressFilters.length > 0) {
      matchProgress = progressFilters.some(filter => {
        if (filter === 'completed') return l.completionPercentage === 100
        if (filter === 'in-progress') return l.completionPercentage !== undefined && l.completionPercentage > 0 && l.completionPercentage < 100
        if (filter === 'not-started') return !l.completionPercentage || l.completionPercentage === 0
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
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/topics')}
            className="text-sm flex items-center gap-1 hover:underline text-gray-600 dark:text-gray-400 px-0 h-auto hover:bg-transparent"
          >
            {t.backToTopics}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-gray-100">{title}</h1>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
              {t.totalLessons} {totalElements}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <Input
              type="text"
              placeholder={t.searchLessons}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#ded8cc] bg-white pl-11 pr-10 text-sm text-gray-900 shadow-none placeholder:text-gray-400 focus-visible:border-[#d4a853] focus-visible:ring-[#d4a853]/20 dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>

          {/* Level dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
              >
                <span>{levelFilters.length === 0 ? t.levelLabel : `${t.levelLabel} (${levelFilters.length})`}</span>
                {levelFilters.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {levelFilters.slice(0, 3).map(level => (
                      <span key={level} className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === level)?.color }} />
                    ))}
                  </span>
                )}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10z" /></svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl bg-[#f5f0e8] dark:bg-[#1a1917] border border-gray-200 dark:border-[#2e3142] p-0">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#2e3142] flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.selectLevel}</span>
                {levelFilters.length > 0 && (
                  <button onClick={() => setLevelFilters([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                    {t.clearAll}
                  </button>
                )}
              </div>
              {LEVEL_BADGES.map(({ level, color, label }) => {
                const isSelected = levelFilters.includes(level)
                return (
                  <DropdownMenuItem
                    key={level}
                    onSelect={(e) => {
                      e.preventDefault()
                      setLevelFilters(isSelected ? levelFilters.filter(l => l !== level) : [...levelFilters, level])
                    }}
                    className="px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#252836] cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
                      style={isSelected ? { borderColor: color, backgroundColor: color } : { borderColor: '#9ca3af' }}>
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
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active filter badges */}
          {(levelFilters.length > 0 || progressFilters.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {levelFilters.map(level => {
                const badge = LEVEL_BADGES.find(l => l.level === level)
                return (
                  <Badge key={level} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer" style={{ backgroundColor: badge?.color }}>
                    {level}
                    <button onClick={() => setLevelFilters(levelFilters.filter(l => l !== level))} className="ml-1 hover:opacity-70">✕</button>
                  </Badge>
                )
              })}
              {progressFilters.map(filter => {
                const progressBadge = PROGRESS_FILTERS.find(f => f.value === filter)
                return (
                  <Badge key={filter} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer" style={{ backgroundColor: progressBadge?.color }}>
                    {progressBadge?.label}
                    <button onClick={() => setProgressFilters(progressFilters.filter(f => f !== filter))} className="ml-1 hover:opacity-70">✕</button>
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Progress dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-auto flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span>{progressFilters.length === 0 ? t.progressLabel : `${t.progressLabel} (${progressFilters.length})`}</span>
                {progressFilters.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {progressFilters.slice(0, 3).map(filter => {
                      const filterObj = PROGRESS_FILTERS.find(f => f.value === filter)
                      return <span key={filter} className="w-2 h-2 rounded-full" style={{ backgroundColor: filterObj?.color }} />
                    })}
                  </span>
                )}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10z" /></svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl bg-[#f5f0e8] dark:bg-[#1a1917] border border-gray-200 dark:border-[#2e3142] p-0">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-[#2e3142] flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.selectProgress}</span>
                {progressFilters.length > 0 && (
                  <button onClick={() => setProgressFilters([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                    {t.clearAll}
                  </button>
                )}
              </div>
              {PROGRESS_FILTERS.map(({ value, label, color }) => {
                const isSelected = progressFilters.includes(value)
                return (
                  <DropdownMenuItem
                    key={value}
                    onSelect={(e) => {
                      e.preventDefault()
                      setProgressFilters(isSelected ? progressFilters.filter(f => f !== value) : [...progressFilters, value])
                    }}
                    className="px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#252836] cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
                      style={isSelected ? { borderColor: color, backgroundColor: color } : { borderColor: '#9ca3af' }}>
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
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lessons Grid */}
        {error ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-2 text-red-500 dark:text-red-400">{t.errorTitle}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{error}</p>
            <Button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#d4a853' }}
            >
              {t.backButton}
            </Button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8,9,10].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#2e3142]">
                <Skeleton className="h-[140px] w-full" />
                <div className="p-3 space-y-2 bg-white dark:bg-[#1a1d27]">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} t={t} />
            ))}
          </div>
        )}

        {filteredLessons.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-sm text-gray-400 dark:text-gray-500">{t.noLessonsFound}</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.prevPage}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) pageNum = i
                else if (page < 3) pageNum = i
                else if (page > totalPages - 4) pageNum = totalPages - 5 + i
                else pageNum = page - 2 + i
                return (
                  <Button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    variant={page === pageNum ? 'default' : 'outline'}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'text-white border-0'
                        : 'bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    style={page === pageNum ? { backgroundColor: '#d4a853' } : {}}
                  >
                    {pageNum + 1}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.nextPage}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
