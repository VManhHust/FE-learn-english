'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/auth/authClient'
import { topicsI18n } from '@/lib/i18n/topics'
import { topicsI18n_en } from '@/lib/i18n/topics_en'
import { useLang } from '@/lib/i18n/LangProvider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Crown } from 'lucide-react'
import ProGateDialog from '@/components/payment/ProGateDialog'
import ProPaymentDialog from '@/components/payment/ProPaymentDialog'
import { useProStatus } from '@/hooks/useProStatus'
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
  youtubeId?: string
  youtubeUrl?: string
  completionPercentage?: number
  premium?: boolean
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

function LessonCard({
  lesson,
  onSelect,
  t,
  canAccessPro,
  onLocked,
}: {
  lesson: Lesson
  onSelect?: (l: Lesson) => void
  t: typeof topicsI18n
  canAccessPro: boolean
  onLocked: () => void
}) {
  const router = useRouter()
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  const emojis = ['🎬', '📚', '🎵', '🌍']
  const thumbnail = lesson.youtubeId
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail

  const handleClick = () => {
    if (lesson.premium && !canAccessPro) {
      onLocked()
      return
    }
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
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {lesson.premium && (
            <span className="flex items-center gap-1 rounded-full bg-[#d4a853] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
              <Crown className="size-3 fill-white/15" />
              PRO
            </span>
          )}
          <div
            className="text-white text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: LEVEL_COLORS[lesson.level] ?? '#6b7280' }}
          >
            {lesson.level}
          </div>
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

const LEVEL_BADGES_BASE = ['A1', 'A2', 'B1', 'B2', 'C1']
const LEVEL_COLORS_MAP: Record<string, string> = {
  A1: '#16a34a', A2: '#2563eb', B1: '#d97706', B2: '#7c3aed', C1: '#dc2626',
}
const LEVEL_BG_MAP: Record<string, string> = {
  A1: '#dcfce7', A2: '#dbeafe', B1: '#fef3c7', B2: '#ede9fe', C1: '#fee2e2',
}
const LEVEL_DARKBG_MAP: Record<string, string> = {
  A1: '#14532d', A2: '#1e3a5f', B1: '#451a03', B2: '#2e1065', C1: '#450a0a',
}

const PROGRESS_VALUES = ['completed', 'in-progress', 'not-started'] as const

export default function TopicsPage() {
  const { lang } = useLang()
  const t = lang === 'en' ? topicsI18n_en : topicsI18n

  const LEVEL_BADGES = LEVEL_BADGES_BASE.map(level => ({
    level,
    color: LEVEL_COLORS_MAP[level],
    bg: LEVEL_BG_MAP[level],
    darkBg: LEVEL_DARKBG_MAP[level],
    label: t[`level${level}` as keyof typeof t] as string,
  }))

  const PROGRESS_FILTERS = [
    { value: 'completed', label: t.completed, color: '#22c55e' },
    { value: 'in-progress', label: t.inProgress, color: '#06b6d4' },
    { value: 'not-started', label: t.notStarted, color: '#6b7280' },
  ]

  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [levelFilters, setLevelFilters] = useState<string[]>([])
  const [progressFilters, setProgressFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showProGate, setShowProGate] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const { isPro } = useProStatus()

  useEffect(() => {
    axiosInstance.get<Topic[]>('/api/topics')
      .then((res) => setTopics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filterLessons = (lessons: Lesson[]) => {
    let filtered = lessons

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Level filter
    if (levelFilters.length > 0) {
      filtered = filtered.filter((l) => levelFilters.includes(l.level))
    }

    // Progress filter
    if (progressFilters.length > 0) {
      filtered = filtered.filter((l) => {
        return progressFilters.some(filter => {
          if (filter === 'completed') {
            return l.completionPercentage === 100
          } else if (filter === 'in-progress') {
            return l.completionPercentage !== undefined && l.completionPercentage > 0 && l.completionPercentage < 100
          } else if (filter === 'not-started') {
            return !l.completionPercentage || l.completionPercentage === 0
          }
          return false
        })
      })
    }

    return filtered
  }

  const filteredTopics = activeTags.length > 0
    ? topics.filter((t) => activeTags.includes(t.name))
    : topics

  return (
    <div className="bg-[#f5f3ef] dark:bg-[#0f0e0c] min-h-screen">
      <div className="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
      {/* Search and Filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative min-w-0 basis-full sm:min-w-[200px] sm:basis-auto sm:flex-1">
          <svg className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#ded8cc] bg-white pl-11 pr-10 text-sm text-gray-900 shadow-none placeholder:text-gray-400 focus-visible:border-[#d4a853] focus-visible:ring-[#d4a853]/20 dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          {searchQuery && (
            <Button
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
              <span>
                {levelFilters.length === 0 ? t.levelLabel : `${t.levelLabel} (${levelFilters.length})`}
              </span>
              {levelFilters.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {levelFilters.slice(0, 3).map(level => (
                    <span key={level} className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === level)?.color }} />
                  ))}
                </span>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10z" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between">
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
                    if (isSelected) {
                      setLevelFilters(levelFilters.filter(l => l !== level))
                    } else {
                      setLevelFilters([...levelFilters, level])
                    }
                  }}
                  className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                >
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
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
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Topic/Tag dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
            >
              <span>{activeTags.length === 0 ? t.topicLabel : `${t.topicLabel} (${activeTags.length})`}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10z" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#f5f3ef] dark:bg-[#1a1917]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.selectTopic}</span>
              {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                  {t.clearAll}
                </button>
              )}
            </div>
            {topics.map((topic) => {
              const isSelected = activeTags.includes(topic.name)
              return (
                <DropdownMenuItem
                  key={topic.id}
                  onSelect={(e) => {
                    e.preventDefault()
                    if (isSelected) {
                      setActiveTags(activeTags.filter(t => t !== topic.name))
                    } else {
                      setActiveTags([...activeTags, topic.name])
                    }
                  }}
                  className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                >
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
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
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Progress dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
            >
              <span>
                {progressFilters.length === 0 ? t.progressLabel : `${t.progressLabel} (${progressFilters.length})`}
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
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10z" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between">
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
                    if (isSelected) {
                      setProgressFilters(progressFilters.filter(f => f !== value))
                    } else {
                      setProgressFilters([...progressFilters, value])
                    }
                  }}
                  className="px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                >
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
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
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        {/* Active filter badges */}
        {(levelFilters.length > 0 || activeTags.length > 0 || progressFilters.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {levelFilters.map(level => {
              const badge = LEVEL_BADGES.find(l => l.level === level)
              return (
                <Badge
                  key={level}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: badge?.color }}
                >
                  {level}
                  <button onClick={() => setLevelFilters(levelFilters.filter(l => l !== level))} className="ml-1 hover:opacity-70">✕</button>
                </Badge>
              )
            })}
            {activeTags.map(tag => (
              <Badge key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900">
                {tag}
                <button onClick={() => setActiveTags(activeTags.filter(t => t !== tag))} className="ml-1 hover:opacity-70">✕</button>
              </Badge>
            ))}
            {progressFilters.map(filter => {
              const progressBadge = PROGRESS_FILTERS.find(f => f.value === filter)
              return (
                <Badge
                  key={filter}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: progressBadge?.color }}
                >
                  {progressBadge?.label}
                  <button
                    onClick={() => setProgressFilters(progressFilters.filter(f => f !== filter))}
                    className="ml-1 hover:opacity-70"
                  >
                    ✕
                  </button>
                </Badge>
              )
            })}
            <button
              onClick={() => { setLevelFilters([]); setActiveTags([]); setProgressFilters([]) }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
            >
              {t.clearAll}
            </button>
          </div>
        )}

      {loading ? (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#1a1a1a]">
                  <Skeleton className="h-28 w-full" />
                  <div className="p-3 space-y-2 bg-white dark:bg-[#0a0a0a]">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredTopics.map((topic) => {
            const filtered = filterLessons(topic.previewLessons ?? [])
            if ((levelFilters.length > 0 || progressFilters.length > 0 || searchQuery) && filtered.length === 0) return null
            return (
            <section key={topic.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {topic.name}{' '}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                    ({topic.lessonCount} {t.lessonCount})
                  </span>
                </h2>
                <Link href={`/dashboard/topics/${topic.slug}`} className="text-sm font-medium flex items-center gap-1" style={{ color: '#3b4fd8' }}>
                  {t.viewAll} &#8250;
                </Link>
              </div>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {filtered.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      t={t}
                      canAccessPro={isPro}
                      onLocked={() => setShowProGate(true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#1a1a1a]">
                      <Skeleton className="h-28 w-full" />
                      <div className="p-3 space-y-2 bg-white dark:bg-[#0a0a0a]">
                        <Skeleton className="h-3 w-full rounded" />
                        <Skeleton className="h-3 w-2/3 rounded" />
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
      <ProGateDialog
        open={showProGate}
        onOpenChange={setShowProGate}
        onUnlock={() => setShowPayment(true)}
      />
      <ProPaymentDialog
        controlledOpen={showPayment}
        onControlledOpenChange={setShowPayment}
        hideTrigger
      />
    </div>
  )
}
