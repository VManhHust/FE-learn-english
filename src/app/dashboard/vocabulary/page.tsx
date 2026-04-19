'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { axiosInstance } from '@/lib/auth/authClient'

interface VocabularyStats {
  totalCards: number
  dueCards: number
  totalReviews: number
  accuracy: number
}

interface LeaderboardEntry {
  rank: number
  displayName: string
  avatarUrl: string | null
  totalScore: number
}

interface VocabularyResponse {
  stats: VocabularyStats
  leaderboard: LeaderboardEntry[]
}

interface DeckCard {
  id: number
  title: string
  cardCount: number
  studentCount: number
  thumbnail: string | null
  tags: string[]
  isPro?: boolean
}

const DEFAULT_STATS: VocabularyStats = { totalCards: 0, dueCards: 0, totalReviews: 0, accuracy: 0 }

interface DeckGroup {
  groupTitle: string
  decks: DeckCard[]
}

const COMMUNITY_DECKS: DeckCard[] = [
  { id: 1, title: '1000 từ tiếng Anh thông dụng', cardCount: 992, studentCount: 160708, thumbnail: null, tags: ['#common', '#basic'] },
  { id: 2, title: 'Từ vựng tiếng Anh giao tiếp', cardCount: 326, studentCount: 33248, thumbnail: null, tags: ['#communication', '#conversation'] },
  { id: 3, title: '600 từ vựng IELTS cơ bản', cardCount: 599, studentCount: 33340, thumbnail: null, tags: ['#ielts', '#essential'] },
  { id: 4, title: 'Thành Ngữ IELTS Thông Dụng', cardCount: 99, studentCount: 296, thumbnail: null, tags: ['#ielts', '#idioms'], isPro: true },
  { id: 5, title: 'Từ vựng chuyên sâu Luyện thi THPT Quốc gia', cardCount: 211, studentCount: 348, thumbnail: null, tags: ['#thpt', '#essential'], isPro: true },
  { id: 6, title: 'Từ vựng thi vào lớp 10', cardCount: 406, studentCount: 280, thumbnail: null, tags: ['#thpt', '#basic'], isPro: true },
  { id: 7, title: 'Từ vựng TOEIC 600+', cardCount: 412, studentCount: 54300, thumbnail: null, tags: ['#toeic', '#ets'] },
  { id: 8, title: 'Từ vựng SAT nâng cao', cardCount: 380, studentCount: 12400, thumbnail: null, tags: ['#sat', '#oxford'], isPro: true },
]

const DECK_GROUPS: DeckGroup[] = [
  { groupTitle: 'Từ Vựng Tiếng Anh Thông Dụng', decks: [{ id: 1, title: '1000 từ tiếng Anh thông dụng', cardCount: 992, studentCount: 160708, thumbnail: null, tags: ['#common', '#basic'] }, { id: 2, title: 'Từ vựng tiếng Anh giao tiếp', cardCount: 326, studentCount: 33248, thumbnail: null, tags: ['#communication', '#conversation'] }] },
  { groupTitle: 'Từ Vựng IELTS', decks: [{ id: 3, title: '600 từ vựng IELTS cơ bản', cardCount: 599, studentCount: 33340, thumbnail: null, tags: ['#ielts'] }, { id: 4, title: 'Thành Ngữ IELTS Thông Dụng', cardCount: 99, studentCount: 296, thumbnail: null, tags: ['#ielts', '#idioms'], isPro: true }] },
  { groupTitle: 'Từ Vựng Ôn Thi Học Thuật', decks: [{ id: 5, title: 'Từ vựng chuyên sâu Luyện thi THPT Quốc gia', cardCount: 211, studentCount: 348, thumbnail: null, tags: ['#thpt'], isPro: true }, { id: 6, title: 'Từ vựng thi vào lớp 10', cardCount: 406, studentCount: 280, thumbnail: null, tags: ['#thpt'], isPro: true }] },
  { groupTitle: 'Từ Vựng TOEIC & SAT', decks: [{ id: 7, title: 'Từ vựng TOEIC 600+', cardCount: 412, studentCount: 54300, thumbnail: null, tags: ['#toeic', '#ets'] }, { id: 8, title: 'Từ vựng SAT nâng cao', cardCount: 380, studentCount: 12400, thumbnail: null, tags: ['#sat'], isPro: true }] },
]

const ALL_TAGS = ['Tất cả', '#a1', '#a2', '#b1', '#b2', '#basic', '#c1', '#common', '#communication', '#conversation', '#essential', '#ets', '#idioms', '#ielts', '#oxford', '#sat', '#thpt', '#toefl', '#toeic']

const DECK_BG_COLORS = ['#3b4fd8', '#f59e0b', '#06b6d4', '#22c55e']

function formatAccuracy(value: number): string {
  return `${Math.round(value)}%`
}

function formatScore(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

function getRankIcon(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

function getRankBadgeBg(rank: number): string {
  if (rank === 1) return '#1a1a2e'
  if (rank === 2) return '#374151'
  if (rank === 3) return '#374151'
  if (rank === 4) return '#06b6d4'
  if (rank === 5) return '#06b6d4'
  return '#6b7280'
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 animate-pulse bg-white" style={{ border: '1px solid #e5e7eb' }}>
      <div className="h-4 w-32 rounded mb-4" style={{ backgroundColor: '#e5e7eb' }} />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded" style={{ backgroundColor: '#e5e7eb' }} />
            <div className="h-6 w-12 rounded" style={{ backgroundColor: '#e5e7eb' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SpacedRepetitionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 space-y-4" style={{ border: '1px solid #e5e7eb' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: '#1a1a2e' }}>Spaced Repetition là gì?</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100" style={{ color: '#6b7280' }}>✕</button>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
          <strong>Spaced Repetition</strong> (Lặp lại ngắt quãng) là phương pháp học tập khoa học giúp bạn ghi nhớ từ vựng lâu hơn bằng cách ôn tập vào đúng thời điểm bạn sắp quên.
        </p>
        <ul className="text-sm space-y-2" style={{ color: '#4b5563' }}>
          <li>📅 Từ mới → ôn lại sau 1 ngày</li>
          <li>✅ Nhớ tốt → ôn lại sau 3 ngày, 7 ngày, 14 ngày...</li>
          <li>❌ Quên → quay lại từ đầu</li>
        </ul>
        <p className="text-xs" style={{ color: '#9ca3af' }}>Nghiên cứu cho thấy phương pháp này giúp ghi nhớ hiệu quả hơn 200% so với học truyền thống.</p>
        <button onClick={onClose} className="w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#3b4fd8' }}>Đã hiểu</button>
      </div>
    </div>
  )
}

export default function VocabularyPage() {
  const router = useRouter()
  const [stats, setStats] = useState<VocabularyStats>(DEFAULT_STATS)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSpacedInfo, setShowSpacedInfo] = useState(false)
  const [activeTag, setActiveTag] = useState('Tất cả')
  const [myDecks] = useState<DeckCard[]>([])
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    const now = new Date()
    setTimestamp(`${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
  }, [])

  useEffect(() => {
    axiosInstance.get<VocabularyResponse>('/api/vocabulary')
      .then((res) => {
        setStats(res.data.stats)
        setLeaderboard(res.data.leaderboard)
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push('/login')
        } else {
          setError('Không thể tải dữ liệu. Vui lòng thử lại.')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const filteredGroups = DECK_GROUPS.map((group) => ({
    ...group,
    decks: activeTag === 'Tất cả'
      ? group.decks
      : group.decks.filter((d) => d.tags.includes(activeTag)),
  })).filter((g) => g.decks.length > 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {showSpacedInfo && <SpacedRepetitionModal onClose={() => setShowSpacedInfo(false)} />}

      <TopicsHeader />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0 px-6 py-6 space-y-6">

          {/* Page Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: '#eff6ff' }}>🦜</div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#1a1a2e' }}>Học Từ Vựng Tiếng Anh</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Thành thạo từ vựng tiếng Anh với hệ thống lặp lại ngắt quãng của LinguaFlow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#1a1a2e' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                Từ vựng đã save
              </button>
              <button onClick={() => setShowSpacedInfo(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ border: '1px solid #e5e7eb', color: '#374151', backgroundColor: '#fff' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                Spaced Repetition là gì?
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>{error}</div>
          )}

          {/* Combined Stats + Status Card */}
          {loading ? <SkeletonCard /> : (
            <div className="rounded-2xl bg-white" style={{ border: '1px solid #e5e7eb' }}>
              <div className="flex flex-col lg:flex-row">
                {/* Left */}
                <div className="flex-1 p-6 space-y-5" style={{ borderRight: '1px solid #f3f4f6' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Thống Kê Học Tập</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>Tổng số Thẻ</p>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>{stats.totalCards}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff7ed' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M13 2.05V4.07c3.39.49 6 3.39 6 6.93 0 3.21-1.81 6-4.72 7.28L13 17v5h5l-1.22-1.22C19.91 19.07 21 16.14 21 13c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.14 1.09 6.07 3.22 8.28L4 21.5h5V17l-1.28 1.28C6.81 17 5 14.21 5 11c0-3.54 2.61-6.44 6-6.93V2.05z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>Đến Hạn</p>
                        <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.dueCards}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>Tổng số Lần Ôn tập</p>
                        <p className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>{stats.totalReviews}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>Độ Chính xác</p>
                        <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{formatAccuracy(stats.accuracy)}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => router.push('/dashboard/vocab-battle')} className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                    ⚔️ Đấu Trường Từ Vựng
                  </button>
                </div>
                {/* Right */}
                <div className="flex-1 p-6 flex flex-col">
                  <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Trạng thái Từ vựng</h2>
                  <div className="grid grid-cols-4 gap-2 mt-auto pt-8">
                    {[
                      { label: 'Đang Học', value: stats.totalCards, color: '#06b6d4' },
                      { label: 'Đang Ôn tập', value: 0, color: '#3b82f6' },
                      { label: 'Đã Thành thạo', value: 0, color: '#22c55e' },
                      { label: 'Tổng số Thẻ', value: stats.totalCards, color: '#ef4444' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-center rounded-lg py-2 text-white text-sm font-bold" style={{ backgroundColor: item.color }}>{item.value}</div>
                        <p className="text-xs text-center" style={{ color: '#6b7280' }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bảng Xếp Hạng */}
          <div className="rounded-2xl bg-white" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <h2 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Bảng Xếp Hạng</h2>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>⏱ Cập nhật lần cuối: {timestamp}</p>
              </div>
              <button onClick={() => router.push('/dashboard/ranking')} className="text-sm flex items-center gap-1 font-medium" style={{ color: '#3b4fd8' }}>
                Xem tất cả ›
              </button>
            </div>

            {leaderboard.length === 0 ? (
              /* Mock data để preview UI */
              <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                {[
                  { rank: 1, displayName: 'hoc tu vung hehe', totalScore: 14192, avatarUrl: null },
                  { rank: 2, displayName: 'Linh Phạm', totalScore: 13689, avatarUrl: null },
                  { rank: 3, displayName: 'Ngọc Trí', totalScore: 13581, avatarUrl: null },
                  { rank: 4, displayName: 'Linh.0707', totalScore: 12643, avatarUrl: null },
                  { rank: 5, displayName: 'Nguyễn Phi Hùng', totalScore: 11928, avatarUrl: null },
                ].map((entry) => {
                  const icon = getRankIcon(entry.rank)
                  const isTop3 = entry.rank <= 3
                  const initials = entry.displayName.charAt(0).toUpperCase()
                  return (
                    <div key={entry.rank} className="flex items-center gap-4 px-6 py-3" style={{ backgroundColor: isTop3 ? '#fffbeb' : 'transparent' }}>
                      <div className="w-7 flex items-center justify-center shrink-0">
                        {icon ? <span className="text-xl">{icon}</span> : <span className="text-sm font-semibold" style={{ color: '#6b7280' }}>{entry.rank}</span>}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: DECK_BG_COLORS[entry.rank % DECK_BG_COLORS.length] }}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full rounded-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1a1a2e' }}>{entry.displayName}</p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>☆ {formatScore(entry.totalScore)}</p>
                      </div>
                      <div className="px-3 py-1 rounded-lg text-xs font-bold text-white shrink-0" style={{ backgroundColor: getRankBadgeBg(entry.rank) }}>
                        #{entry.rank}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                {leaderboard.map((entry) => {
                  const icon = getRankIcon(entry.rank)
                  const isTop3 = entry.rank <= 3
                  const initials = entry.displayName.charAt(0).toUpperCase()
                  return (
                    <div key={entry.rank} className="flex items-center gap-4 px-6 py-3" style={{ backgroundColor: isTop3 ? '#fffbeb' : 'transparent' }}>
                      <div className="w-7 flex items-center justify-center shrink-0">
                        {icon ? <span className="text-xl">{icon}</span> : <span className="text-sm font-semibold" style={{ color: '#6b7280' }}>{entry.rank}</span>}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: DECK_BG_COLORS[entry.rank % DECK_BG_COLORS.length] }}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full rounded-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1a1a2e' }}>{entry.displayName}</p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>☆ {formatScore(entry.totalScore)}</p>
                      </div>
                      <div className="px-3 py-1 rounded-lg text-xs font-bold text-white shrink-0" style={{ backgroundColor: getRankBadgeBg(entry.rank) }}>
                        #{entry.rank}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bộ Thẻ Của Tôi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1a2e' }}>Bộ Thẻ Của Tôi</h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{myDecks.length}/3 bộ thẻ</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#1a1a2e' }}>
                  + Tạo Bộ Thẻ
                </button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid #e5e7eb', color: '#6b7280' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </button>
              </div>
            </div>

            {myDecks.length === 0 ? (
              <div className="rounded-2xl bg-white py-12 flex flex-col items-center gap-3" style={{ border: '1px solid #e5e7eb' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ border: '2px dashed #d1d5db' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14"/>
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Chưa có bộ thẻ nào</p>
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Tạo bộ thẻ đầu tiên để bắt đầu quản lý từ vựng của bạn</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1" style={{ backgroundColor: '#1a1a2e' }}>
                  + Tạo Bộ Thẻ Đầu Tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myDecks.map((deck) => (
                  <div key={deck.id} className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-white" style={{ border: '1px solid #e5e7eb' }}>
                    <div className="h-28 flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: DECK_BG_COLORS[deck.id % DECK_BG_COLORS.length] }}>
                      📚
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-semibold line-clamp-2" style={{ color: '#1a1a2e' }}>{deck.title}</p>
                      <div className="flex gap-3 text-xs" style={{ color: '#9ca3af' }}>
                        <span>📋 {deck.cardCount} thẻ</span>
                        <span>👤 {formatCount(deck.studentCount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Xem Bộ Thẻ Cộng Đồng */}
          <div className="rounded-2xl flex items-center justify-between px-5 py-4" style={{ border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Xem Bộ Thẻ Cộng Đồng</span>
            </div>
            <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#1a1a2e' }}>
              Khám phá
            </button>
          </div>

          {/* Lọc theo Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#374151' }}>Lọc theo Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                  style={{
                    backgroundColor: activeTag === tag ? '#1a1a2e' : '#f3f4f6',
                    color: activeTag === tag ? '#fff' : '#374151',
                    border: '1px solid transparent',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Community Deck Groups */}
          {filteredGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                {group.groupTitle}{' '}
                <span style={{ color: '#9ca3af', fontWeight: 400 }}>({group.decks.length} bộ thẻ)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.decks.map((deck) => (
                  <div
                    key={deck.id}
                    className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-white flex flex-col"
                    style={{ border: deck.isPro ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}
                  >
                    <div
                      className="relative h-36 flex items-center justify-center text-white font-bold text-center px-3"
                      style={{ backgroundColor: DECK_BG_COLORS[(deck.id - 1) % DECK_BG_COLORS.length] }}
                    >
                      <span className="text-sm leading-snug">{deck.title}</span>
                      {deck.isPro && (
                        <div
                          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                          style={{ backgroundColor: '#f59e0b', color: '#fff' }}
                        >
                          👑 PRO
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2 flex flex-col flex-1">
                      <p
                        className="text-xs font-semibold line-clamp-2 flex-1"
                        style={{ color: deck.isPro ? '#f59e0b' : '#1a1a2e' }}
                      >
                        {deck.title}
                      </p>
                      <div className="flex gap-3 text-xs" style={{ color: '#9ca3af' }}>
                        <span>📋 {deck.cardCount} thẻ</span>
                        <span>👤 {formatCount(deck.studentCount)} học viên</span>
                      </div>
                      <button
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1"
                        style={{
                          background: deck.isPro
                            ? 'linear-gradient(135deg, #06b6d4, #7c3aed)'
                            : '#1a1a2e',
                        }}
                      >
                        {deck.isPro && '👑 '}Bắt đầu Học
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </main>
      </div>
    </div>
  )
}

