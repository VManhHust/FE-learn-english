'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { axiosInstance } from '@/lib/auth/authClient'
import { topicsI18n } from '@/lib/i18n/topics'
import { extra } from '@/lib/i18n/dashboard'
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
  youtubeId?: string
  youtubeUrl?: string
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

function LessonCard({ lesson }: { lesson: Lesson }) {
  const router = useRouter()
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  const emojis = ['🎬', '📚', '🎵', '🌍']
  const thumbnail = lesson.youtubeId
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col border border-gray-200 dark:border-[#2e3142]"
      onClick={() => router.push(`/dashboard/learn/dictation/${lesson.id}`)}
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
      <div className="p-3 bg-white dark:bg-[#252836] flex flex-col flex-1" style={{ minHeight: 72 }}>
        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1 text-gray-900 dark:text-gray-100">
          {lesson.title}
        </p>
        <div className="flex gap-3 text-xs mt-2 text-gray-500 dark:text-gray-400">
          {lesson.hasDictation && <span>{topicsI18n.dictation} &#9432;</span>}
          {lesson.hasShadowing && <span>{topicsI18n.shadowing} &#9432;</span>}
        </div>
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
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
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
    if (!levelFilter) return lessons
    return lessons.filter((l) => l.level === levelFilter)
  }

  const filteredTopics = activeTag
    ? topics.filter((t) => t.name === activeTag)
    : topics

  return (
    <div>
      {selectedLesson && (
        <LessonModeModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Level dropdown */}
        <div className="relative" ref={levelRef}>
          <button
            onClick={() => { setLevelOpen(!levelOpen); setTagOpen(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <span>
              {levelFilter
                ? LEVEL_BADGES.find(l => l.level === levelFilter)?.label
                : 'Cấp độ'}
            </span>
            {levelFilter && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === levelFilter)?.color }}
              />
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
              {LEVEL_BADGES.map(({ level, color, bg, label }) => (
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

        {/* Topic/Tag dropdown */}
        <div className="relative" ref={tagRef}>
          <button
            onClick={() => { setTagOpen(!tagOpen); setLevelOpen(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-[#1a1d27] border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <span>{activeTag ? `# ${activeTag}` : 'Chủ đề'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`transition-transform ${tagOpen ? 'rotate-180' : ''}`}>
              <path d="M6 8L1 3h10z" />
            </svg>
          </button>
          {tagOpen && (
            <div className="absolute left-0 top-11 w-64 rounded-xl shadow-lg py-1 z-50 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => { setActiveTag(null); setTagOpen(false) }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#252836] ${!activeTag ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Tất cả chủ đề
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setActiveTag(activeTag === topic.name ? null : topic.name); setTagOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#252836]"
                >
                  <span className="text-gray-400">#</span>
                  <span className={activeTag === topic.name ? 'font-semibold text-[#3b4fd8] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}>
                    {topic.name}
                  </span>
                  {activeTag === topic.name && (
                    <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b4fd8" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active filter badges */}
        {(levelFilter || activeTag) && (
          <div className="flex items-center gap-2">
            {levelFilter && (
              <span
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: LEVEL_BADGES.find(l => l.level === levelFilter)?.color }}
              >
                {levelFilter}
                <button onClick={() => setLevelFilter(null)} className="ml-1 hover:opacity-70">✕</button>
              </span>
            )}
            {activeTag && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900">
                # {activeTag}
                <button onClick={() => setActiveTag(null)} className="ml-1 hover:opacity-70">✕</button>
              </span>
            )}
            <button
              onClick={() => { setLevelFilter(null); setActiveTag(null) }}
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
            if (levelFilter && filtered.length === 0) return null
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
                    <LessonCard key={lesson.id} lesson={lesson} onSelect={setSelectedLesson} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl overflow-hidden animate-pulse border border-gray-200 dark:border-[#2e3142]">
                      <div className="h-28 bg-gray-200 dark:bg-[#252836]" />
                      <div className="p-3 space-y-2 bg-white dark:bg-[#1a1d27]">
                        <div className="h-3 rounded bg-gray-200 dark:bg-[#252836]" />
                        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-[#252836]" />
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

      {/* Reviews */}
      </div>

      {/* Reviews */}
      <section className="space-y-8 bg-gray-50 dark:bg-[#13151f] border-t border-b border-gray-200 dark:border-[#2e3142]" style={{ padding: '48px 40px' }}>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-sans font-black text-gray-900 dark:text-gray-100">
            {extra.reviews.title}
          </h2>
          <p className="text-sm max-w-lg mx-auto text-gray-500 dark:text-gray-400">
            {extra.reviews.subtitle}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span style={{ color: '#f59e0b', fontSize: 20 }}>{'\u2605\u2605\u2605\u2605\u2605'}</span>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{extra.reviews.rating}</span>
          </div>
          <p className="text-xs text-gray-400">{extra.reviews.ratingNote}</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {extra.reviews.items.map((r, i) => (
            <div key={i} className="rounded-2xl p-5 space-y-3 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{r.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#252836] text-gray-500 dark:text-gray-400">{r.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#f59e0b', fontSize: 14 }}>{Array(r.stars).fill('\u2605').join('')}</span>
                <span className="text-xs text-gray-400">{r.date}</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App CTA */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <section className="rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#f0f4ff] dark:bg-[#1a1d27] border border-[#c7d2fe] dark:border-[#2e3142]">
          <div className="space-y-2">
            <h3 className="text-xl font-sans font-black text-gray-900 dark:text-gray-100">{extra.app.title}</h3>
            <p className="text-sm max-w-sm text-gray-600 dark:text-gray-400">{extra.app.desc}</p>
          </div>
          <button className="shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold text-sm bg-gray-900 dark:bg-gray-100 dark:text-gray-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            {extra.app.cta}
          </button>
        </section>
      </div>

      {/* FAQ */}
      {/* Footer */}
    </div>
  )
}
