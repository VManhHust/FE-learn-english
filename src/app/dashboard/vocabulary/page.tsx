'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { axiosInstance } from '@/lib/auth/authClient'
import { vocabularyBankApi, VocabularyBankEntry } from '@/lib/api/vocabularyBank'

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
    <div className="rounded-2xl p-6 animate-pulse bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
      <div className="h-4 w-32 rounded mb-4 bg-gray-200 dark:bg-[#252836]" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-[#252836]" />
            <div className="h-6 w-12 rounded bg-gray-200 dark:bg-[#252836]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SpacedRepetitionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 max-w-md w-full mx-4 space-y-4 border border-gray-200 dark:border-[#2e3142]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Spaced Repetition là gì?</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#252836] text-gray-500 dark:text-gray-400">✕</button>
        </div>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          <strong>Spaced Repetition</strong> (Lặp lại ngắt quãng) là phương pháp học tập khoa học giúp bạn ghi nhớ từ vựng lâu hơn bằng cách ôn tập vào đúng thời điểm bạn sắp quên.
        </p>
        <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
          <li>📅 Từ mới → ôn lại sau 1 ngày</li>
          <li>✅ Nhớ tốt → ôn lại sau 3 ngày, 7 ngày, 14 ngày...</li>
          <li>❌ Quên → quay lại từ đầu</li>
        </ul>
        <p className="text-xs text-gray-400">Nghiên cứu cho thấy phương pháp này giúp ghi nhớ hiệu quả hơn 200% so với học truyền thống.</p>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #3b4fd8, #6366f1)' }}>Đã hiểu</button>
      </div>
    </div>
  )
}

function SavedWordsView({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [words, setWords] = useState<VocabularyBankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'flashcard' | 'write'>('list')
  const hasSpeechSupport = typeof window !== 'undefined' && 'speechSynthesis' in window

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vocabularyBankApi.list()
      setWords(data.content)
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push('/login')
      } else {
        setError('Không thể tải từ vựng đã lưu.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    try {
      await vocabularyBankApi.delete(id)
      setWords(prev => prev.filter(w => w.id !== id))
      if (selectedWord && words.find(w => w.id === id)?.word === selectedWord) {
        setSelectedWord(null)
      }
    } catch {
      // silent fail
    }
  }

  const handleSpeak = (word: string) => {
    if (!hasSpeechSupport) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const buildDictionaryUrl = (word: string) => {
    const normalized = word.toLowerCase().trim()
    return {
      oxford: `https://www.oxfordlearnersdictionaries.com/definition/english/${normalized}`,
      cambridge: `https://dictionary.cambridge.org/dictionary/english/${normalized}`,
    }
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 dark:bg-[#0f1117]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#252836] text-gray-700 dark:text-gray-300 transition-colors"
            title="Quay lại"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
              🦜
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Từ vựng của tôi</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý danh sách từ vựng của bạn đã ôn tập</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] overflow-hidden">
          <div className="flex gap-2 px-6 pt-4 border-b border-gray-200 dark:border-[#2e3142]">
            <button
              onClick={() => setActiveTab('list')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                backgroundColor: activeTab === 'list' ? 'rgba(59,79,216,0.1)' : 'transparent',
                color: activeTab === 'list' ? '#3b4fd8' : '#6b7280',
                borderBottom: activeTab === 'list' ? '2px solid #3b4fd8' : '2px solid transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Danh sách
            </button>
            <button
              onClick={() => setActiveTab('flashcard')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                backgroundColor: activeTab === 'flashcard' ? 'rgba(59,79,216,0.1)' : 'transparent',
                color: activeTab === 'flashcard' ? '#3b4fd8' : '#6b7280',
                borderBottom: activeTab === 'flashcard' ? '2px solid #3b4fd8' : '2px solid transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="15" rx="2"/>
                <path d="M16 3h2a2 2 0 0 1 2 2v2"/>
              </svg>
              Thẻ ghi nhớ
            </button>
            <button
              onClick={() => setActiveTab('write')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                backgroundColor: activeTab === 'write' ? 'rgba(59,79,216,0.1)' : 'transparent',
                color: activeTab === 'write' ? '#3b4fd8' : '#6b7280',
                borderBottom: activeTab === 'write' ? '2px solid #3b4fd8' : '2px solid transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Viết
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải từ vựng...</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p className="text-sm text-red-500 mb-3">{error}</p>
                <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && words.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#252836] flex items-center justify-center mb-4 text-4xl">
                  🦜
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Chưa có từ vựng nào</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Thêm từ vựng bằng cách nhấp vào biểu tượng sao khi xem bài học + khi xem bài học
                </p>
              </div>
            )}

            {!loading && !error && words.length > 0 && activeTab === 'list' && (
              <div className="space-y-4">
                {/* Word chips */}
                <div className="flex flex-wrap gap-2">
                  {words.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer group"
                      style={{
                        borderColor: selectedWord === entry.word ? '#3b4fd8' : '#d1d5db',
                        backgroundColor: selectedWord === entry.word ? 'rgba(59,79,216,0.1)' : '#f9fafb',
                      }}
                      onClick={() => setSelectedWord(selectedWord === entry.word ? null : entry.word)}
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{
                          color: selectedWord === entry.word ? '#3b4fd8' : '#1f2937',
                        }}
                      >
                        {entry.word}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(entry.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 ml-1"
                        title="Xóa"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Word detail panel */}
                {selectedWord && (
                  <div className="rounded-xl border border-gray-200 dark:border-[#2e3142] bg-gray-50 dark:bg-[#252836] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e3142] pb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedWord}</h3>
                      <button
                        onClick={() => setSelectedWord(null)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#2e3142] text-gray-500 dark:text-gray-400 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hasSpeechSupport && (
                        <button
                          onClick={() => handleSpeak(selectedWord)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252836]"
                        >
                          {isSpeaking ? (
                            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            </svg>
                          )}
                          <span>{isSpeaking ? 'Đang phát...' : 'Phát âm'}</span>
                        </button>
                      )}

                      <div className="flex gap-2">
                        <a
                          href={buildDictionaryUrl(selectedWord).oxford}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252836]"
                        >
                          <span>📖</span>
                          <span>Oxford</span>
                        </a>
                        <a
                          href={buildDictionaryUrl(selectedWord).cambridge}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252836]"
                        >
                          <span>📚</span>
                          <span>Cambridge</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && words.length > 0 && activeTab === 'flashcard' && (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tính năng Thẻ ghi nhớ đang được phát triển...</p>
              </div>
            )}

            {!loading && !error && words.length > 0 && activeTab === 'write' && (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tính năng Viết đang được phát triển...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function VocabularyPage() {
  const router = useRouter()
  const [stats, setStats] = useState<VocabularyStats>(DEFAULT_STATS)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSpacedInfo, setShowSpacedInfo] = useState(false)
  const [showSavedWords, setShowSavedWords] = useState(false)
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
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#0f1117]">
      {showSpacedInfo && <SpacedRepetitionModal onClose={() => setShowSpacedInfo(false)} />}

      <TopicsHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {showSavedWords ? (
          <SavedWordsView onBack={() => setShowSavedWords(false)} />
        ) : (
          <main className="flex-1 min-w-0 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50 dark:bg-[#0f1117]">

          {/* Page Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: '#eff6ff' }}>🦜</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Học Từ Vựng Tiếng Anh</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Thành thạo từ vựng tiếng Anh với hệ thống lặp lại ngắt quãng của LinguaFlow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSavedWords(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity" 
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #374151)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                Từ vựng đã save
              </button>
              <button onClick={() => setShowSpacedInfo(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252836]">
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
            <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
              <div className="flex flex-col lg:flex-row">
                {/* Left */}
                <div className="flex-1 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-[#2e3142]">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Thống Kê Học Tập</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tổng số Thẻ</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalCards ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff7ed' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M13 2.05V4.07c3.39.49 6 3.39 6 6.93 0 3.21-1.81 6-4.72 7.28L13 17v5h5l-1.22-1.22C19.91 19.07 21 16.14 21 13c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.14 1.09 6.07 3.22 8.28L4 21.5h5V17l-1.28 1.28C6.81 17 5 14.21 5 11c0-3.54 2.61-6.44 6-6.93V2.05z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Đến Hạn</p>
                        <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats?.dueCards ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tổng số Lần Ôn tập</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalReviews ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Độ Chính xác</p>
                        <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{formatAccuracy(stats?.accuracy ?? 0)}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => router.push('/dashboard/vocab-battle')} className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)', letterSpacing: '0.02em' }}>
                    ⚔️ Đấu Trường Từ Vựng
                  </button>
                </div>
                {/* Right */}
                <div className="flex-1 p-6 flex flex-col">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trạng thái Từ vựng</h2>
                  <div className="grid grid-cols-4 gap-2 mt-auto pt-8">
                    {[
                      { label: 'Đang Học', value: stats?.totalCards ?? 0, color: '#06b6d4' },
                      { label: 'Đang Ôn tập', value: 0, color: '#3b82f6' },
                      { label: 'Đã Thành thạo', value: 0, color: '#22c55e' },
                      { label: 'Tổng số Thẻ', value: stats?.totalCards ?? 0, color: '#ef4444' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-center rounded-lg py-2 text-white text-sm font-bold" style={{ backgroundColor: item.color }}>{item.value}</div>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bảng Xếp Hạng */}
          <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bảng Xếp Hạng</h2>
                </div>
                <p className="text-xs mt-0.5 text-gray-400">⏱ Cập nhật lần cuối: {timestamp}</p>
              </div>
              <button onClick={() => router.push('/dashboard/ranking')} className="text-sm flex items-center gap-1 font-medium" style={{ color: '#3b4fd8' }}>
                Xem tất cả ›
              </button>
            </div>

            {(leaderboard?.length ?? 0) === 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-[#2e3142]">
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
                    <div key={entry.rank} className={`flex items-center gap-4 px-6 py-3 ${isTop3 ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
                      <div className="w-7 flex items-center justify-center shrink-0">
                        {icon ? <span className="text-xl">{icon}</span> : <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{entry.rank}</span>}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: DECK_BG_COLORS[entry.rank % DECK_BG_COLORS.length] }}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full rounded-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{entry.displayName}</p>
                        <p className="text-xs text-gray-400">☆ {formatScore(entry.totalScore)}</p>
                      </div>
                      <div className="px-3 py-1 rounded-lg text-xs font-bold text-white shrink-0" style={{ backgroundColor: getRankBadgeBg(entry.rank) }}>
                        #{entry.rank}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#2e3142]">
                {leaderboard.map((entry) => {
                  const icon = getRankIcon(entry.rank)
                  const isTop3 = entry.rank <= 3
                  const initials = entry.displayName.charAt(0).toUpperCase()
                  return (
                    <div key={entry.rank} className={`flex items-center gap-4 px-6 py-3 ${isTop3 ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
                      <div className="w-7 flex items-center justify-center shrink-0">
                        {icon ? <span className="text-xl">{icon}</span> : <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{entry.rank}</span>}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: DECK_BG_COLORS[entry.rank % DECK_BG_COLORS.length] }}>
                        {entry.avatarUrl ? <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full rounded-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{entry.displayName}</p>
                        <p className="text-xs text-gray-400">☆ {formatScore(entry.totalScore)}</p>
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
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Bộ Thẻ Của Tôi</h2>
                <p className="text-xs text-gray-400">{myDecks.length}/3 bộ thẻ</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #1a1a2e, #374151)' }}>
                  + Tạo Bộ Thẻ
                </button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#252836] transition-colors border border-gray-200 dark:border-[#2e3142] text-gray-500 dark:text-gray-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                </button>
              </div>
            </div>

            {myDecks.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142] py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14"/>
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chưa có bộ thẻ nào</p>
                  <p className="text-xs mt-1 text-gray-400">Tạo bộ thẻ đầu tiên để bắt đầu quản lý từ vựng của bạn</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1 shadow-sm hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #1a1a2e, #374151)' }}>
                  + Tạo Bộ Thẻ Đầu Tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myDecks.map((deck) => (
                  <div key={deck.id} className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
                    <div className="h-28 flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: DECK_BG_COLORS[deck.id % DECK_BG_COLORS.length] }}>
                      📚
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-semibold line-clamp-2 text-gray-900 dark:text-gray-100">{deck.title}</p>
                      <div className="flex gap-3 text-xs text-gray-400">
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
          <div className="rounded-2xl flex items-center justify-between px-5 py-4 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3142]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Xem Bộ Thẻ Cộng Đồng</span>
            </div>
            <button className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #1a1a2e, #374151)' }}>
              Khám phá
            </button>
          </div>

          {/* Lọc theo Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lọc theo Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    activeTag === tag
                      ? 'text-white'
                      : 'bg-gray-100 dark:bg-[#252836] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2e3142]'
                  }`}
                  style={activeTag === tag ? {
                    background: 'linear-gradient(135deg, #1a1a2e, #374151)',
                    boxShadow: '0 2px 6px rgba(26,26,46,0.25)',
                  } : undefined}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Community Deck Groups */}
          {filteredGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {group.groupTitle}{' '}
                <span className="text-gray-400 font-normal">({group.decks.length} bộ thẻ)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.decks.map((deck) => (
                  <div
                    key={deck.id}
                    className={`rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-[#1a1d27] flex flex-col ${
                      deck.isPro ? 'border-2 border-amber-400' : 'border border-gray-200 dark:border-[#2e3142]'
                    }`}
                  >
                    <div
                      className="relative h-36 flex items-center justify-center text-white font-bold text-center px-3"
                      style={{ backgroundColor: DECK_BG_COLORS[(deck.id - 1) % DECK_BG_COLORS.length] }}
                    >
                      <span className="text-sm leading-snug">{deck.title}</span>
                      {deck.isPro && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-400 text-white">
                          👑 PRO
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2 flex flex-col flex-1">
                      <p className={`text-xs font-semibold line-clamp-2 flex-1 ${deck.isPro ? 'text-amber-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {deck.title}
                      </p>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>📋 {deck.cardCount} thẻ</span>
                        <span>👤 {formatCount(deck.studentCount)} học viên</span>
                      </div>
                      <button
                        className="w-full py-2.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1 shadow-sm hover:opacity-90 transition-opacity"
                        style={{
                          background: deck.isPro
                            ? 'linear-gradient(135deg, #06b6d4, #7c3aed)'
                            : 'linear-gradient(135deg, #1a1a2e, #374151)',
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
        )}
      </div>
    </div>
  )
}

