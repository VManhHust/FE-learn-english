'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  previewLessons: Lesson[]
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

function LessonCard({ lesson, onSelect }: { lesson: Lesson; onSelect: (l: Lesson) => void }) {
  const bgs = ['#1e3a5f', '#2d4a2d', '#4a1a1a', '#1a1a4e']
  const bg = bgs[lesson.id % bgs.length]
  const emojis = ['🎬', '📚', '🎵', '🌍']
  const thumbnail = lesson.youtubeId
    ? `https://img.youtube.com/vi/${lesson.youtubeId}/mqdefault.jpg`
    : lesson.thumbnail

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col"
      style={{ border: '1px solid #e5e7eb' }}
      onClick={() => onSelect(lesson)}
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
      <div className="p-3 bg-white flex flex-col flex-1" style={{ minHeight: 72 }}>
        <p className="text-xs font-medium leading-snug line-clamp-2 flex-1" style={{ color: '#1a1a2e' }}>
          {lesson.title}
        </p>
        <div className="flex gap-3 text-xs mt-2" style={{ color: '#6b7280' }}>
          {lesson.hasDictation && <span>{topicsI18n.dictation} &#9432;</span>}
          {lesson.hasShadowing && <span>{topicsI18n.shadowing} &#9432;</span>}
        </div>
      </div>
    </div>
  )
}

const BEGINNER_LEVELS = ['A1', 'A2']
const EXPERT_LEVELS = ['B1', 'B2', 'C1']

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<'beginner' | 'expert' | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    axiosInstance.get<Topic[]>('/api/topics')
      .then((res) => setTopics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filterLessons = (lessons: Lesson[]) => {
    if (!levelFilter) return lessons
    const levels = levelFilter === 'beginner' ? BEGINNER_LEVELS : EXPERT_LEVELS
    return lessons.filter((l) => levels.includes(l.level))
  }

  return (
    <div>
      {selectedLesson && (
        <LessonModeModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setLevelFilter(levelFilter === 'beginner' ? null : 'beginner')}
          className="rounded-xl p-5 space-y-1 text-left transition-all"
          style={{
            backgroundColor: levelFilter === 'beginner' ? '#dbeafe' : '#eff6ff',
            border: levelFilter === 'beginner' ? '2px solid #3b82f6' : '1px solid #bfdbfe',
            cursor: 'pointer',
          }}
        >
          <p className="font-semibold text-sm" style={{ color: '#1e40af' }}>{topicsI18n.bannerBeginner}</p>
          <p className="text-xs" style={{ color: '#3b82f6' }}>{topicsI18n.bannerBeginnerDesc}</p>
          {levelFilter === 'beginner' && (
            <p className="text-xs font-medium mt-1" style={{ color: '#1d4ed8' }}>✓ Đang lọc A1, A2</p>
          )}
        </button>
        <button
          onClick={() => setLevelFilter(levelFilter === 'expert' ? null : 'expert')}
          className="rounded-xl p-5 space-y-1 text-left transition-all"
          style={{
            backgroundColor: levelFilter === 'expert' ? '#ede9fe' : '#f5f3ff',
            border: levelFilter === 'expert' ? '2px solid #7c3aed' : '1px solid #ddd6fe',
            cursor: 'pointer',
          }}
        >
          <p className="font-semibold text-sm" style={{ color: '#6d28d9' }}>{topicsI18n.bannerExpert}</p>
          <p className="text-xs" style={{ color: '#7c3aed' }}>{topicsI18n.bannerExpertDesc}</p>
          {levelFilter === 'expert' && (
            <p className="text-xs font-medium mt-1" style={{ color: '#6d28d9' }}>✓ Đang lọc B1, B2, C1</p>
          )}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold" style={{ color: '#374151' }}>{topicsI18n.tagLabel}</p>
        <div className="flex flex-wrap gap-2">
          {TAG_FILTERS.map((tag) => {
            const slug = TAG_TO_SLUG[tag]
            if (slug) {
              return (
                <Link
                  key={tag}
                  href={`/dashboard/topics/${slug}`}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  # {tag}
                </Link>
              )
            }
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: activeTag === tag ? '#1a1a2e' : '#f3f4f6',
                  color: activeTag === tag ? '#fff' : '#374151',
                  border: '1px solid #e5e7eb',
                }}
              >
                # {tag}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-10">
          {topics.map((topic) => {
            const filtered = filterLessons(topic.previewLessons)
            return (
            <section key={topic.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>
                  {topic.name}{' '}
                  <span className="text-sm font-normal" style={{ color: '#9ca3af' }}>
                    ({topic.lessonCount} {topicsI18n.lessonCount})
                  </span>
                </h2>
                <button className="text-sm font-medium flex items-center gap-1" style={{ color: '#3b4fd8' }}>
                  {topicsI18n.viewAll} &#8250;
                </button>
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
                    <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ border: '1px solid #e5e7eb' }}>
                      <div className="h-28" style={{ backgroundColor: '#e5e7eb' }} />
                      <div className="p-3 space-y-2 bg-white">
                        <div className="h-3 rounded" style={{ backgroundColor: '#e5e7eb' }} />
                        <div className="h-3 w-2/3 rounded" style={{ backgroundColor: '#e5e7eb' }} />
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
      <section className="space-y-8" style={{ backgroundColor: '#fafafa', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '48px 40px' }}>
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-sans font-black" style={{ color: '#1a1a2e' }}>
            {extra.reviews.title}
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#6b7280' }}>
            {extra.reviews.subtitle}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span style={{ color: '#f59e0b', fontSize: 20 }}>{'\u2605\u2605\u2605\u2605\u2605'}</span>
            <span className="font-bold text-lg" style={{ color: '#1a1a2e' }}>{extra.reviews.rating}</span>
          </div>
          <p className="text-xs" style={{ color: '#9ca3af' }}>{extra.reviews.ratingNote}</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {extra.reviews.items.map((r, i) => (
            <div key={i} className="rounded-2xl p-5 space-y-3 bg-white" style={{ border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{r.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>{r.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#f59e0b', fontSize: 14 }}>{Array(r.stars).fill('\u2605').join('')}</span>
                <span className="text-xs" style={{ color: '#9ca3af' }}>{r.date}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App CTA */}
      <div className="max-w-5xl mx-auto px-6 py-6">
      <section
        className="rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{ backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe' }}
      >
        <div className="space-y-2">
          <h3 className="text-xl font-sans font-black" style={{ color: '#1a1a2e' }}>{extra.app.title}</h3>
          <p className="text-sm max-w-sm" style={{ color: '#4b5563' }}>{extra.app.desc}</p>
        </div>
        <button
          className="shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ backgroundColor: '#1a1a2e' }}
        >
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
