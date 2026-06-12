'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  BookMarked,
  Check,
  ChevronDown,
  Crown,
  Search,
  Volume2,
  Swords,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLang } from '@/lib/i18n/LangProvider'
import { vocabularyI18n } from '@/lib/i18n/vocabulary'
import { vocabularyI18n_en } from '@/lib/i18n/vocabulary_en'
import {
  vocabularyApi,
  type VocabularyDeckCard,
  type VocabularyDeckCategory,
  type VocabularyStatsResponse,
} from '@/lib/api/vocabulary'
import { vocabularyBankApi, type VocabularyBankEntry } from '@/lib/api/vocabularyBank'

type ProgressFilter = 'all' | 'not-started' | 'learning' | 'completed'

const EMPTY_STATS: VocabularyStatsResponse = {
  totalWords: 0,
  learned: 0,
  reviewing: 0,
  accuracy: 0,
}

const PROGRESS_OPTIONS: Array<{
  value: Exclude<ProgressFilter, 'all'>
  label: string
  color: string
}> = [
  { value: 'not-started', label: 'Chưa bắt đầu', color: '#6b7280' },
  { value: 'learning', label: 'Đang học', color: '#06b6d4' },
  { value: 'completed', label: 'Hoàn thành', color: '#22c55e' },
]

function formatCount(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function progressKey(deck: VocabularyDeckCard): Exclude<ProgressFilter, 'all'> {
  if (deck.completionPercentage >= 100) return 'completed'
  if (deck.learnedWords > 0) return 'learning'
  return 'not-started'
}

function progressLabel(deck: VocabularyDeckCard) {
  const key = progressKey(deck)
  if (key === 'completed') return 'Hoàn thành'
  if (key === 'learning') return 'Đang học'
  return 'Chưa bắt đầu'
}

function DeckCard({ deck }: { deck: VocabularyDeckCard }) {
  const router = useRouter()
  const state = progressKey(deck)

  return (
    <article className="flex min-h-[300px] flex-col overflow-hidden rounded-lg border border-[#e5e3df] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#2e2c29] dark:bg-[#171614]">
      <button
        type="button"
        onClick={() => router.push(`/dashboard/vocabulary/${deck.slug}`)}
        className="relative flex h-40 items-center justify-center px-6 text-center text-white"
        style={{ backgroundColor: deck.coverColor }}
      >
        <span className="max-w-[240px] text-lg font-bold leading-snug">{deck.title}</span>
        {deck.premium && (
          <Badge className="absolute right-3 top-3 gap-1 border-0 bg-[#d4a853] text-white">
            <Crown className="size-3" /> PRO
          </Badge>
        )}
        {state !== 'not-started' && (
          <Badge
            className="absolute bottom-3 left-3 rounded-full border-0 px-3 text-white"
            style={{
              backgroundColor: state === 'completed' ? '#3f8f65' : '#b8832e',
            }}
          >
            {state === 'completed' && <Check className="mr-1 size-3" />}
            {progressLabel(deck)}
          </Badge>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">
            {deck.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6b7280]">{deck.description}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7a7060] dark:text-[#9f998c]">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" /> {deck.wordCount} thẻ
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {formatCount(deck.learnerCount)}
            </span>
          </div>
          <Progress
            value={deck.completionPercentage}
            className="h-1.5 bg-[#ede4d0] dark:bg-[#2e2c29] [&_[data-slot=progress-indicator]]:bg-[#d4a853]"
          />
          <Button
            className="h-9 w-full bg-[#1a1a2e] text-white hover:bg-[#303047] dark:bg-[#d4a853] dark:text-[#16130d] dark:hover:bg-[#c39a45]"
            onClick={() => router.push(`/dashboard/vocabulary/${deck.slug}`)}
          >
            {deck.learnedWords > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
          </Button>
        </div>
      </div>
    </article>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="overflow-hidden rounded-lg border border-[#e5e3df] bg-white dark:border-[#2e2c29] dark:bg-[#171614]">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SpacedRepetitionModal({ onClose, v }: { onClose: () => void; v: typeof vocabularyI18n }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 max-w-md w-full mx-4 space-y-4 border border-gray-200 dark:border-[#1a1a1a]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{v.spacedTitle}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">✕</Button>
        </div>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          <strong>Spaced Repetition</strong> {v.spacedDesc}
        </p>
        <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
          <li>{v.spacedStep1}</li>
          <li>{v.spacedStep2}</li>
          <li>{v.spacedStep3}</li>
        </ul>
        <p className="text-xs text-gray-400">{v.spacedNote}</p>
        <Button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #3b4fd8, #6366f1)' }}>{v.gotIt}</Button>
      </div>
    </div>
  )
}

function SavedWordsView({ onBack, v }: { onBack: () => void; v: typeof vocabularyI18n }) {
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
      if (err?.response?.status === 401) router.push('/login')
      else setError(v.errorLoadSaved)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await vocabularyBankApi.delete(id)
      setWords((current) => current.filter((word) => word.id !== id))
      if (selectedWord && words.find((word) => word.id === id)?.word === selectedWord) setSelectedWord(null)
    } catch {}
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

  const dictionaryUrl = (word: string, dictionary: 'oxford' | 'cambridge') => {
    const normalized = word.toLowerCase().trim()
    return dictionary === 'oxford'
      ? `https://www.oxfordlearnersdictionaries.com/definition/english/${normalized}`
      : `https://dictionary.cambridge.org/dictionary/english/${normalized}`
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="size-10 rounded-full text-[#7a7060] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:text-[#b8b2a6] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl border border-[#ead9b5] bg-[#fff8e8] text-2xl shadow-sm dark:border-[#594526] dark:bg-[#2a2115]">🦜</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{v.myVocabTitle}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{v.myVocabSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#ded8cc] bg-white shadow-sm dark:border-[#34312d] dark:bg-[#171614]">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <div className="border-b border-[#eee5d5] px-4 py-3 dark:border-[#34312d]">
              <TabsList className="h-auto w-full justify-start gap-2 rounded-xl bg-[#f5f3ef] p-1 dark:bg-[#12110f]">
                {(['list', 'flashcard', 'write'] as const).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="h-10 rounded-lg px-5 text-sm font-semibold text-[#7a7060] shadow-none transition data-[state=active]:bg-white data-[state=active]:text-[#9a6b18] data-[state=active]:shadow-sm dark:text-[#9f998c] dark:data-[state=active]:bg-[#2a2115] dark:data-[state=active]:text-[#d4b05a]"
                  >
                    {tab === 'list' ? v.tabList : tab === 'flashcard' ? v.tabFlashcard : v.tabWrite}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-56 p-6">
              {loading && <div className="py-20 text-center text-sm text-gray-500">{v.loadingVocab}</div>}
              {!loading && error && (
                <div className="py-20 text-center">
                  <p className="text-sm text-red-500 mb-3">{error}</p>
                  <Button onClick={load}>{v.retry}</Button>
                </div>
              )}
              {!loading && !error && words.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-4 text-4xl">🦜</div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{v.noWordsTitle}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{v.noWordsSubtitle}</p>
                </div>
              )}
              {!loading && !error && words.length > 0 && (
                <>
                  <TabsContent value="list" className="mt-0">
                    <div className="mb-4">
                      <h2 className="text-sm font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.tabList}</h2>
                      <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{words.length} {v.cards}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {words.map((entry) => (
                        <div
                          key={entry.id}
                          className={`group flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                            selectedWord === entry.word
                              ? 'border-[#d4a853] bg-[#fff8e8] text-[#9a6b18] shadow-sm dark:border-[#d4b05a] dark:bg-[#2a2115] dark:text-[#d4b05a]'
                              : 'border-[#ded8cc] bg-[#faf8f3] text-[#4b5563] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6]'
                          }`}
                          onClick={() => setSelectedWord(selectedWord === entry.word ? null : entry.word)}
                        >
                          <span>{entry.word}</span>
                          <button onClick={(event) => { event.stopPropagation(); handleDelete(entry.id) }} className="flex size-5 items-center justify-center rounded-full text-[#9f998c] opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30">×</button>
                        </div>
                      ))}
                    </div>
                    {selectedWord && (
                      <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#ead9b5] bg-[#fffdf8] p-5 text-center shadow-sm dark:border-[#594526] dark:bg-[#12110f]">
                        <div>
                          <div className="text-center">
                            <p className="text-xs font-medium uppercase tracking-wider text-[#9f998c]">Vocabulary</p>
                            <h3 className="mt-1 text-xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{selectedWord}</h3>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleSpeak(selectedWord)}
                            className="mt-4 h-9 gap-2 rounded-lg border-[#d4a853] bg-[rgba(212,168,83,0.12)] px-4 font-semibold text-[#9a6b18] hover:bg-[rgba(212,168,83,0.2)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]"
                          >
                            <Volume2 className="size-4" />
                            {isSpeaking ? v.playing : v.pronounce}
                          </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-[#eee5d5] pt-4 dark:border-[#34312d]">
                          <Button variant="outline" asChild className="h-9 gap-2 rounded-lg border-[#ded8cc] bg-white px-4 text-sm font-semibold text-[#4b5563] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#b8b2a6]">
                            <a href={dictionaryUrl(selectedWord, 'oxford')} target="_blank" rel="noreferrer"><BookOpen className="size-4" /> Oxford</a>
                          </Button>
                          <Button variant="outline" asChild className="h-9 gap-2 rounded-lg border-[#ded8cc] bg-white px-4 text-sm font-semibold text-[#4b5563] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#b8b2a6]">
                            <a href={dictionaryUrl(selectedWord, 'cambridge')} target="_blank" rel="noreferrer"><BookMarked className="size-4" /> Cambridge</a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="flashcard" className="mt-0"><div className="py-20 text-center text-sm text-[#7a7060] dark:text-[#9f998c]">{v.flashcardComingSoon}</div></TabsContent>
                  <TabsContent value="write" className="mt-0"><div className="py-20 text-center text-sm text-[#7a7060] dark:text-[#9f998c]">{v.writeComingSoon}</div></TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

export default function VocabularyPage() {
  const router = useRouter()
  const { lang } = useLang()
  const v = lang === 'en' ? vocabularyI18n_en : vocabularyI18n
  const [categories, setCategories] = useState<VocabularyDeckCategory[]>([])
  const [stats, setStats] = useState<VocabularyStatsResponse>(EMPTY_STATS)
  const [showSpacedInfo, setShowSpacedInfo] = useState(false)
  const [showSavedWords, setShowSavedWords] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [progressFilters, setProgressFilters] = useState<Array<Exclude<ProgressFilter, 'all'>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDecks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await vocabularyApi.getDecks()
      setCategories(response.categories)
    } catch {
      setError('Không thể tải danh sách bộ từ vựng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDecks()
    vocabularyApi.getStats().then(setStats).catch(() => setStats(EMPTY_STATS))
  }, [])

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi')

    return categories
      .map((item) => ({
        ...item,
        decks: item.decks.filter((deck) => {
          const matchesCategory =
            categoryFilters.length === 0 || categoryFilters.includes(item.name)
          const matchesSearch =
            !normalizedSearch ||
            deck.title.toLocaleLowerCase('vi').includes(normalizedSearch) ||
            deck.description.toLocaleLowerCase('vi').includes(normalizedSearch)
          const matchesProgress =
            progressFilters.length === 0 || progressFilters.includes(progressKey(deck))
          return matchesCategory && matchesSearch && matchesProgress
        }),
      }))
      .filter((item) => item.decks.length > 0)
  }, [categories, categoryFilters, progressFilters, search])

  const hasActiveFilters = categoryFilters.length > 0 || progressFilters.length > 0
  const learningWords = Math.max(stats.totalWords - stats.learned - stats.reviewing, 0)
  const statusItems = [
    { label: 'Đang học', value: learningWords, color: '#d4a853' },
    { label: 'Đang ôn tập', value: stats.reviewing, color: '#b8832e' },
    { label: 'Đã thành thạo', value: stats.learned, color: '#3f8f65' },
    { label: 'Tổng số thẻ', value: stats.totalWords, color: '#24284f' },
  ]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      {showSpacedInfo && <SpacedRepetitionModal onClose={() => setShowSpacedInfo(false)} v={v} />}
      <TopicsHeader />
      <div className="flex min-h-0 flex-1">
        <Sidebar />

        {showSavedWords ? (
          <SavedWordsView onBack={() => setShowSavedWords(false)} v={v} />
        ) : (
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">
                  Học Từ Vựng Tiếng Anh
                </h1>
                <p className="mt-1 text-sm text-[#647084] dark:text-[#9f998c]">
                  Thành thạo từ vựng tiếng Anh với hệ thống lặp lại ngắt quãng của LinguaFlow
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  onClick={() => setShowSavedWords(true)}
                  className="h-11 gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 font-semibold text-[#1a1a2e] shadow-sm hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#e8e3d8] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                  {v.savedVocabBtn}
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/vocab-battle')}
                  className="h-11 gap-2 rounded-xl border border-[#d4a853] bg-[#d4a853] px-5 font-bold text-white shadow-sm hover:border-[#c29643] hover:bg-[#c29643] dark:border-[#d4b05a] dark:bg-[#d4b05a] dark:text-[#16130d] dark:hover:border-[#c39a45] dark:hover:bg-[#c39a45]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.87 12.87 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.35 22.35 0 0 1-3.95 2z"/></svg>
                  Bắn Từ Vựng
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSpacedInfo(true)}
                  className="h-11 gap-2 rounded-xl border-[#ded8cc] bg-[#faf8f3] px-5 font-semibold text-[#4b5563] shadow-sm hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"/><path d="M12 18h.01"/></svg>
                  {v.spacedRepetitionBtn}
                </Button>
              </div>
            </section>

            <section className="mb-7 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white shadow-sm dark:border-[#34312d] dark:bg-[#171614]">
              <div className="grid lg:grid-cols-2">
                <div className="border-b border-[#eee8dc] p-6 lg:border-b-0 lg:border-r dark:border-[#2e2c29]">
                  <div>
                    <h2 className="text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">Thống Kê Học Tập</h2>
                    <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">Tổng quan tiến độ học từ vựng của bạn</p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 rounded-xl border border-[#eee5d5] bg-[#faf8f3] p-3 dark:border-[#34312d] dark:bg-[#12110f]">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]"><BookOpen className="size-5" /></span>
                      <div><p className="text-xs text-[#7a7060] dark:text-[#9f998c]">Tổng số Thẻ</p><p className="mt-0.5 text-xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{stats.totalWords}</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-[#eee5d5] bg-[#faf8f3] p-3 dark:border-[#34312d] dark:bg-[#12110f]">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]"><TrendingUp className="size-5" /></span>
                      <div><p className="text-xs text-[#7a7060] dark:text-[#9f998c]">Đến Hạn</p><p className="mt-0.5 text-xl font-bold text-[#b8832e] dark:text-[#d4b05a]">{stats.reviewing}</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-[#eee5d5] bg-[#faf8f3] p-3 dark:border-[#34312d] dark:bg-[#12110f]">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f1eee7] text-[#7a7060] dark:bg-[#25231f] dark:text-[#b8b2a6]"><Swords className="size-5" /></span>
                      <div><p className="text-xs text-[#7a7060] dark:text-[#9f998c]">Tổng số Lần Ôn tập</p><p className="mt-0.5 text-xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{stats.reviewing}</p></div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-[#eee5d5] bg-[#faf8f3] p-3 dark:border-[#34312d] dark:bg-[#12110f]">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf5ef] text-[#3f8f65] dark:bg-[#17271f] dark:text-[#6db68b]"><Trophy className="size-5" /></span>
                      <div><p className="text-xs text-[#7a7060] dark:text-[#9f998c]">Độ Chính xác</p><p className="mt-0.5 text-xl font-bold text-[#3f8f65] dark:text-[#6db68b]">{Math.round(stats.accuracy)}%</p></div>
                    </div>
                  </div>
                  <Button onClick={() => router.push('/dashboard/vocab-battle')} className="mt-4 h-11 w-full gap-2 rounded-xl border border-[#d4a853] bg-[rgba(212,168,83,0.12)] font-bold text-[#9a6b18] shadow-none hover:bg-[rgba(212,168,83,0.2)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]">
                    <Swords className="size-4" /> Đấu Trường Từ Vựng
                  </Button>
                </div>

                <div className="flex min-h-64 flex-col bg-[#fdfcf9] p-6 dark:bg-[#151411]">
                  <div>
                    <h2 className="text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">Trạng thái Từ vựng</h2>
                    <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">Phân bổ thẻ theo trạng thái học tập</p>
                  </div>
                  <div className="mt-auto grid grid-cols-4 items-end gap-3 border-b border-[#ded8cc] pt-8 dark:border-[#34312d]">
                    {statusItems.map((item) => {
                      const maxValue = Math.max(...statusItems.map((status) => status.value), 1)
                      const height = item.value === 0 ? 18 : Math.max(36, Math.round((item.value / maxValue) * 130))
                      return (
                        <div key={item.label} className="flex flex-col items-center">
                          <div className="flex w-full max-w-24 items-start justify-center rounded-t-xl pt-2 text-xs font-bold text-white shadow-sm transition-[height]" style={{ height, backgroundColor: item.color }}>
                            {item.value}
                          </div>
                          <p className="min-h-10 pt-2 text-center text-[10px] leading-4 text-[#7a7060] dark:text-[#9f998c]">{item.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-7 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm chủ đề hoặc bộ thẻ..."
                  className="w-full h-9 pl-9 pr-9 rounded-lg text-sm border border-gray-200 dark:border-[#1a1a1a] bg-[#f5f3ef] dark:bg-[#1a1917] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:ring-0 focus-visible:border-gray-400 dark:focus-visible:border-gray-500 shadow-sm"
                  style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearch('')}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-[#f5f3ef] dark:bg-[#1a1917] border-gray-200 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
                    style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                  >
                    <span>{categoryFilters.length === 0 ? 'Chủ đề' : `Chủ đề (${categoryFilters.length})`}</span>
                    <ChevronDown className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#f5f3ef] dark:bg-[#1a1917]">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chọn chủ đề</span>
                    {categoryFilters.length > 0 && (
                      <button onClick={() => setCategoryFilters([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  {categories.map((item) => (
                    <DropdownMenuItem
                      key={item.name}
                      onSelect={(event) => {
                        event.preventDefault()
                        setCategoryFilters((current) =>
                          current.includes(item.name)
                            ? current.filter((value) => value !== item.name)
                            : [...current, item.name],
                        )
                      }}
                      className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
                        style={categoryFilters.includes(item.name) ? { borderColor: '#3b4fd8', backgroundColor: '#3b4fd8' } : { borderColor: '#9ca3af' }}
                      >
                        {categoryFilters.includes(item.name) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={categoryFilters.includes(item.name) ? 'font-semibold text-[#3b4fd8] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}>
                        {item.name}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-[#f5f3ef] dark:bg-[#1a1917] border-gray-200 dark:border-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm"
                    style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                  >
                    <span>{progressFilters.length === 0 ? 'Tiến độ' : `Tiến độ (${progressFilters.length})`}</span>
                    {progressFilters.length > 0 && (
                      <span className="flex items-center gap-1">
                        {progressFilters.slice(0, 3).map((filter) => {
                          const option = PROGRESS_OPTIONS.find((item) => item.value === filter)
                          return (
                            <span
                              key={filter}
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: option?.color }}
                            />
                          )
                        })}
                      </span>
                    )}
                    <ChevronDown className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chọn tiến độ</span>
                    {progressFilters.length > 0 && (
                      <button onClick={() => setProgressFilters([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  {PROGRESS_OPTIONS.map(({ value, label, color }) => (
                    <DropdownMenuItem
                      key={value}
                      onSelect={(event) => {
                        event.preventDefault()
                        setProgressFilters((current) =>
                          current.includes(value)
                            ? current.filter((item) => item !== value)
                            : [...current, value],
                        )
                      }}
                      className="px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
                        style={progressFilters.includes(value) ? { borderColor: color, backgroundColor: color } : { borderColor: '#9ca3af' }}
                      >
                        {progressFilters.includes(value) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className={progressFilters.includes(value) ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}>
                        {label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </section>

            {hasActiveFilters && (
              <div className="mb-7 flex items-center gap-2 flex-wrap">
                {categoryFilters.map((topic) => (
                  <Badge key={topic} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900">
                    {topic}
                    <button onClick={() => setCategoryFilters((current) => current.filter((item) => item !== topic))} className="ml-1 hover:opacity-70">×</button>
                  </Badge>
                ))}
                {progressFilters.map((filter) => {
                  const option = PROGRESS_OPTIONS.find((item) => item.value === filter)
                  return (
                    <Badge
                      key={filter}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: option?.color }}
                    >
                      {option?.label}
                      <button onClick={() => setProgressFilters((current) => current.filter((item) => item !== filter))} className="ml-1 hover:opacity-70">×</button>
                    </Badge>
                  )
                })}
                <button onClick={() => { setCategoryFilters([]); setProgressFilters([]) }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">
                  Xóa tất cả
                </button>
              </div>
            )}

            {loading && <LoadingGrid />}

            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-white px-6 py-12 text-center dark:border-red-950 dark:bg-[#171614]">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" className="mt-4" onClick={loadDecks}>
                  Thử lại
                </Button>
              </div>
            )}

            {!loading && !error && filteredCategories.length === 0 && (
              <div className="rounded-lg border border-[#e5e3df] bg-white px-6 py-16 text-center dark:border-[#2e2c29] dark:bg-[#171614]">
                <BookOpen className="mx-auto size-9 text-[#b9b1a2]" />
                <h2 className="mt-3 text-sm font-semibold">Không tìm thấy bộ thẻ phù hợp</h2>
                <p className="mt-1 text-xs text-[#7a7060]">Thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                {filteredCategories.map((item) => (
                  <section key={item.name}>
                    <h2 className="mb-3 text-sm font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">
                      {item.name}{' '}
                      <span className="font-normal text-[#9ca3af]">({item.decks.length} bộ thẻ)</span>
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {item.decks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>
        )}
      </div>
    </div>
  )
}
