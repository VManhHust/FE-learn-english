'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  BookMarked,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Crown,
  Heart,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  WandSparkles,
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
import { vocabularyI18n, type VocabularyI18n } from '@/lib/i18n/vocabulary'
import { vocabularyI18n_en } from '@/lib/i18n/vocabulary_en'
import {
  vocabularyApi,
  type VocabularyDeckCard,
  type VocabularyDeckCategory,
  type VocabularyStatsResponse,
  type VocabularyWordCard,
} from '@/lib/api/vocabulary'
import { vocabularyBankApi, type VocabularyBankEntry } from '@/lib/api/vocabularyBank'
import { streakApi, type StreakResponse } from '@/lib/api/streak'
import ProGateDialog from '@/components/payment/ProGateDialog'
import ProPaymentDialog from '@/components/payment/ProPaymentDialog'
import { useProStatus } from '@/hooks/useProStatus'

type ProgressFilter = 'all' | 'not-started' | 'learning' | 'completed'
type WordFilter = 'all' | 'unlearned' | 'not-mastered' | 'mastered' | 'saved'

const EMPTY_STATS: VocabularyStatsResponse = {
  totalWords: 0,
  mastered: 0,
  notMastered: 0,
  totalReviews: 0,
}

function formatCount(value: number, lang: 'vi' | 'en') {
  return new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function toLocalDayKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function progressKey(deck: VocabularyDeckCard): Exclude<ProgressFilter, 'all'> {
  if (deck.completionPercentage >= 100) return 'completed'
  if (deck.learnedWords > 0) return 'learning'
  return 'not-started'
}

function progressLabel(deck: VocabularyDeckCard, v: VocabularyI18n) {
  const key = progressKey(deck)
  if (key === 'completed') return v.progressCompleted
  if (key === 'learning') return v.progressLearning
  return v.progressNotStarted
}

function localizedDeckTitle(deck: VocabularyDeckCard, v: VocabularyI18n) {
  const titles: Record<string, string> = {
    '1000-tu-tieng-anh-thong-dung': v.deck1,
    'tu-vung-tieng-anh-giao-tiep': v.deck2,
    '600-tu-vung-ielts-co-ban': v.deck3,
    'thanh-ngu-ielts-thong-dung': v.deck4,
  }
  return titles[deck.slug] ?? deck.title
}

function localizedDeckDescription(deck: VocabularyDeckCard, v: VocabularyI18n) {
  const descriptions: Record<string, string> = {
    '1000-tu-tieng-anh-thong-dung': v.deck1Description,
    'tu-vung-tieng-anh-giao-tiep': v.deck2Description,
    '600-tu-vung-ielts-co-ban': v.deck3Description,
    'thanh-ngu-ielts-thong-dung': v.deck4Description,
  }
  return descriptions[deck.slug] ?? deck.description
}

function localizedCategory(name: string, v: VocabularyI18n) {
  const categories: Record<string, string> = {
    'Từ Vựng Tiếng Anh Thông Dụng': v.groupCommon,
    'Từ Vựng IELTS': v.groupIELTS,
    'Từ Vựng Ôn Thi Học Thuật': v.groupAcademic,
    'Từ Vựng TOEIC & SAT': v.groupTOEIC,
  }
  return categories[name] ?? name
}

function DeckCard({
  deck,
  lang,
  v,
  canAccessPro,
  onLocked,
}: {
  deck: VocabularyDeckCard
  lang: 'vi' | 'en'
  v: VocabularyI18n
  canAccessPro: boolean
  onLocked: () => void
}) {
  const router = useRouter()
  const state = progressKey(deck)
  const openDeck = () => {
    if (deck.premium && !canAccessPro) {
      onLocked()
      return
    }
    router.push(`/dashboard/vocabulary/${deck.slug}`)
  }

  return (
    <article className="flex min-h-[300px] flex-col overflow-hidden rounded-lg border border-[#e5e3df] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#2e2c29] dark:bg-[#171614]">
      <button
        type="button"
        onClick={openDeck}
        className="relative flex h-40 items-center justify-center px-6 text-center text-white"
        style={{ backgroundColor: deck.coverColor }}
      >
        <span className="max-w-[240px] text-lg font-bold leading-snug">{localizedDeckTitle(deck, v)}</span>
        {deck.premium && (
          <Badge className="absolute right-3 top-3 gap-1 rounded-full border-0 bg-[#d4a853] px-3 text-white">
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
            {progressLabel(deck, v)}
          </Badge>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">
            {localizedDeckTitle(deck, v)}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6b7280]">{localizedDeckDescription(deck, v)}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7a7060] dark:text-[#9f998c]">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" /> {deck.wordCount} {v.cards}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {formatCount(deck.learnerCount, lang)}
            </span>
          </div>
          <Progress
            value={deck.completionPercentage}
            className="h-1.5 bg-[#ede4d0] dark:bg-[#2e2c29] [&_[data-slot=progress-indicator]]:bg-[#d4a853]"
          />
          <Button
            className="h-9 w-full bg-[#1a1a2e] text-white hover:bg-[#303047] dark:bg-[#d4a853] dark:text-[#16130d] dark:hover:bg-[#c39a45]"
            onClick={openDeck}
          >
            {deck.learnedWords > 0 ? v.continueLearning : v.startLearning}
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
  const contentLanguage = lang
  const v = lang === 'en' ? vocabularyI18n_en : vocabularyI18n
  const [categories, setCategories] = useState<VocabularyDeckCategory[]>([])
  const [stats, setStats] = useState<VocabularyStatsResponse>(EMPTY_STATS)
  const [featuredWord, setFeaturedWord] = useState<VocabularyWordCard | null>(null)
  const [streak, setStreak] = useState<StreakResponse | null>(null)
  const [words, setWords] = useState<VocabularyWordCard[]>([])
  const [savedWordEntries, setSavedWordEntries] = useState<VocabularyBankEntry[]>([])
  const [wordSearch, setWordSearch] = useState('')
  const [wordFilter, setWordFilter] = useState<WordFilter>('all')
  const [wordListLimit, setWordListLimit] = useState(8)
  const [wordsLoading, setWordsLoading] = useState(true)
  const [savingWordId, setSavingWordId] = useState<number | null>(null)
  const [showSpacedInfo, setShowSpacedInfo] = useState(false)
  const [showSavedWords, setShowSavedWords] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [showProGate, setShowProGate] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const { isPro } = useProStatus()
  const [progressFilters, setProgressFilters] = useState<Array<Exclude<ProgressFilter, 'all'>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const progressOptions = [
    { value: 'not-started' as const, label: v.progressNotStarted, color: '#6b7280' },
    { value: 'learning' as const, label: v.progressLearning, color: '#06b6d4' },
    { value: 'completed' as const, label: v.progressCompleted, color: '#22c55e' },
  ]

  const loadDecks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await vocabularyApi.getDecks()
      setCategories(response.categories)
    } catch {
      setError(v.errorLoad)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDecks()
    vocabularyApi.getStats().then(setStats).catch(() => setStats(EMPTY_STATS))
    streakApi.getStatus().then(setStreak).catch(() => setStreak(null))
    Promise.all([
      vocabularyApi.getWords(),
      vocabularyBankApi.list(0, 1000),
    ])
      .then(([wordData, savedData]) => {
        setWords(wordData)
        setSavedWordEntries(savedData.content)
      })
      .catch(() => {
        setWords([])
        setSavedWordEntries([])
      })
      .finally(() => setWordsLoading(false))
  }, [])

  const allDecks = useMemo(
    () => categories.flatMap((category) => category.decks),
    [categories],
  )

  const activeDeck = useMemo(
    () =>
      allDecks.find((deck) => deck.learnedWords > 0 && deck.completionPercentage < 100) ??
      allDecks.find((deck) => deck.learnedWords > 0) ??
      allDecks.find((deck) => deck.wordCount > 0) ??
      null,
    [allDecks],
  )

  useEffect(() => {
    let active = true

    if (!activeDeck) {
      setFeaturedWord(null)
      return () => {
        active = false
      }
    }

    vocabularyApi
      .getDeck(activeDeck.slug)
      .then(async (detail) => {
        const word =
          detail.currentCard ??
          (await vocabularyApi.getDeck(activeDeck.slug, undefined, 1)).currentCard
        if (active) setFeaturedWord(word)
      })
      .catch(() => {
        if (active) setFeaturedWord(null)
      })

    return () => {
      active = false
    }
  }, [activeDeck])

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
            localizedDeckTitle(deck, v).toLocaleLowerCase(lang).includes(normalizedSearch) ||
            localizedDeckDescription(deck, v).toLocaleLowerCase(lang).includes(normalizedSearch)
          const matchesProgress =
            progressFilters.length === 0 || progressFilters.includes(progressKey(deck))
          return matchesCategory && matchesSearch && matchesProgress
        }),
      }))
      .filter((item) => item.decks.length > 0)
  }, [categories, categoryFilters, lang, progressFilters, search, v])

  const hasActiveFilters = categoryFilters.length > 0 || progressFilters.length > 0
  const unlearnedWords = Math.max(stats.totalWords - stats.mastered - stats.notMastered, 0)
  const statusItems = [
    { label: v.unlearned, value: unlearnedWords, color: '#d4a853' },
    { label: v.notMastered, value: stats.notMastered, color: '#b8832e' },
    { label: v.mastered, value: stats.mastered, color: '#3f8f65' },
    { label: v.totalCards, value: stats.totalWords, color: '#24284f' },
  ]
  const maxStatusValue = Math.max(...statusItems.map((status) => status.value), 1)
  const reviewMinutes = stats.notMastered === 0 ? 0 : Math.max(1, Math.ceil(stats.notMastered / 2))
  const checkedInDates = new Set(streak?.checkedInDates ?? [])
  const streakToday = new Date(`${streak?.today ?? toLocalDayKey(new Date())}T00:00:00`)
  const monday = new Date(streakToday)
  monday.setDate(streakToday.getDate() - ((streakToday.getDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = toLocalDayKey(date)
    return {
      key,
      label: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index],
      checked: checkedInDates.has(key),
      today: key === (streak?.today ?? toLocalDayKey(new Date())),
    }
  })

  const playFeaturedWord = () => {
    if (!featuredWord) return
    const audioUrl = featuredWord.audioUsUrl ?? featuredWord.audioUkUrl
    if (audioUrl) {
      void new Audio(audioUrl).play()
      return
    }
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(featuredWord.word)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  const savedWordsByName = useMemo(
    () =>
      new Map(
        savedWordEntries.map((entry) => [entry.word.trim().toLocaleLowerCase('en'), entry]),
      ),
    [savedWordEntries],
  )

  const filteredWords = useMemo(() => {
    const query = wordSearch.trim().toLocaleLowerCase('vi')
    return words.filter((word) => {
      const saved = savedWordsByName.has(word.word.trim().toLocaleLowerCase('en'))
      const matchesSearch =
        !query ||
        word.word.toLocaleLowerCase('en').includes(query) ||
        word.vietnameseTranslation.toLocaleLowerCase('vi').includes(query) ||
        word.englishDefinition.toLocaleLowerCase('en').includes(query)
      const matchesFilter =
        wordFilter === 'all' ||
        (wordFilter === 'unlearned' && word.learningStatus === 'UNLEARNED') ||
        (wordFilter === 'not-mastered' && word.learningStatus === 'NOT_MASTERED') ||
        (wordFilter === 'mastered' && word.learningStatus === 'MASTERED') ||
        (wordFilter === 'saved' && saved)
      return matchesSearch && matchesFilter
    })
  }, [savedWordsByName, wordFilter, wordSearch, words])

  useEffect(() => {
    setWordListLimit(8)
  }, [wordFilter, wordSearch])

  const playWord = (word: VocabularyWordCard) => {
    const audioUrl = word.audioUsUrl ?? word.audioUkUrl
    if (audioUrl) {
      void new Audio(audioUrl).play()
      return
    }
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleSavedWord = async (word: VocabularyWordCard) => {
    if (savingWordId !== null) return
    const key = word.word.trim().toLocaleLowerCase('en')
    const savedEntry = savedWordsByName.get(key)
    setSavingWordId(word.id)
    try {
      if (savedEntry) {
        await vocabularyBankApi.delete(savedEntry.id)
        setSavedWordEntries((current) => current.filter((entry) => entry.id !== savedEntry.id))
      } else {
        const saved = await vocabularyBankApi.save(word.word)
        setSavedWordEntries((current) => [...current, saved])
      }
    } finally {
      setSavingWordId(null)
    }
  }

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
                  {v.pageTitle}
                </h1>
                <p className="mt-1 text-sm text-[#647084] dark:text-[#9f998c]">
                  {v.pageSubtitle}
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
                  variant="outline"
                  onClick={() => setShowSpacedInfo(true)}
                  className="h-11 gap-2 rounded-xl border-[#ded8cc] bg-[#faf8f3] px-5 font-semibold text-[#4b5563] shadow-sm hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"/><path d="M12 18h.01"/></svg>
                  {v.spacedRepetitionBtn}
                </Button>
              </div>
            </section>

            <section className="mb-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_19rem]">
              <div className="rounded-2xl border border-[#ded8cc] bg-white p-5 dark:border-[#34312d] dark:bg-[#171614]">
                <h2 className="text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.learningStats}</h2>
                <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{v.learningStatsSubtitle}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: v.totalCards, value: stats.totalWords, icon: '📖', tone: 'gold' },
                    { label: v.mastered, value: stats.mastered, icon: '🏆', tone: 'green' },
                    { label: v.reviews, value: stats.totalReviews, icon: WandSparkles, tone: 'neutral' },
                    { label: v.notMastered, value: stats.notMastered, icon: '🎯', tone: 'gold' },
                  ].map((item) => {
                    const Icon = typeof item.icon === 'string' ? null : item.icon
                    const iconClass =
                      item.tone === 'green'
                        ? 'bg-[#eaf5ef] text-[#3f8f65] dark:bg-[#17271f] dark:text-[#6db68b]'
                        : item.tone === 'neutral'
                          ? 'bg-[#f1eee7] text-[#7a7060] dark:bg-[#25231f] dark:text-[#b8b2a6]'
                          : 'bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]'
                    return (
                      <div key={item.label} className="min-h-28 rounded-xl border border-[#eee5d5] bg-[#faf8f3] p-4 dark:border-[#34312d] dark:bg-[#12110f]">
                        <span className={`flex size-9 items-center justify-center rounded-lg ${iconClass}`}>
                          {Icon ? (
                            <Icon className="size-[18px]" />
                          ) : (
                            <span aria-hidden="true" className="text-lg leading-none">
                              {typeof item.icon === 'string' ? item.icon : null}
                            </span>
                          )}
                        </span>
                        <p className="mt-3 text-xs text-[#7a7060] dark:text-[#9f998c]">{item.label}</p>
                        <p className="mt-1 text-2xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{formatCount(item.value, lang)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex min-h-[20rem] flex-col rounded-2xl border border-[#ded8cc] bg-white p-5 dark:border-[#34312d] dark:bg-[#171614]">
                <h2 className="text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.vocabStatus}</h2>
                <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{v.vocabStatusSubtitle}</p>

                <div className="mt-auto grid grid-cols-4 items-end gap-3 pt-8">
                  {statusItems.map((item) => {
                    const height = item.value === 0 ? 8 : Math.max(24, Math.round((item.value / maxStatusValue) * 104))
                    return (
                      <div key={item.label} className="flex min-w-0 flex-col items-center">
                        <div
                          className="flex w-full items-start justify-center rounded-t-lg pt-2 text-xs font-bold text-white transition-[height]"
                          style={{ height, backgroundColor: item.color }}
                        >
                          {item.value}
                        </div>
                        <p className="min-h-10 pt-2 text-center text-[10px] leading-4 text-[#7a7060] dark:text-[#9f998c]">{item.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <aside className="grid gap-4 sm:grid-cols-2 xl:row-span-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-[#ded8cc] bg-white p-5 text-center dark:border-[#34312d] dark:bg-[#171614]">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a7060] dark:text-[#9f998c]">
                    <Sparkles className="size-3.5 text-[#d4a853]" />
                    {v.todayWord}
                  </div>
                  {featuredWord ? (
                    <>
                      <button
                        type="button"
                        onClick={playFeaturedWord}
                        className="mt-4 inline-flex items-center gap-2 text-2xl font-bold text-[#1a1a2e] transition-colors hover:text-[#b8832e] dark:text-[#e8e3d8] dark:hover:text-[#d4b05a]"
                      >
                        {featuredWord.word}
                        <Volume2 className="size-4" />
                      </button>
                      <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{featuredWord.ipaUs ?? featuredWord.ipaUk}</p>
                      <p className="mt-4 rounded-xl border border-[#eee5d5] bg-[#faf8f3] px-3 py-2 text-left text-sm text-[#4b5563] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6]">
                        {contentLanguage === 'vi'
                          ? featuredWord.vietnameseTranslation
                          : featuredWord.englishDefinition}
                      </p>
                      {featuredWord.exampleSentence && (
                        <p className="mt-3 text-left text-xs italic leading-5 text-[#7a7060] dark:text-[#9f998c]">
                          &ldquo;{featuredWord.exampleSentence}&rdquo;
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-5 text-sm text-[#7a7060] dark:text-[#9f998c]">{v.noFeaturedWord}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#ded8cc] bg-white p-5 dark:border-[#34312d] dark:bg-[#171614]">
                  <div className="flex items-center justify-center gap-2">
                    <CalendarDays className="size-4 text-[#d4a853]" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a7060] dark:text-[#9f998c]">{v.weeklyLearning}</h3>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-1.5">
                    {weekDays.map((day) => (
                      <div key={day.key} className="text-center">
                        <span className="text-[10px] font-medium text-[#7a7060] dark:text-[#9f998c]">{day.label}</span>
                        <span
                          className={`mt-1 flex aspect-square items-center justify-center rounded-full border text-xs font-bold ${
                            day.checked
                              ? 'border-[#d4a853] bg-[#d4a853] text-white'
                              : day.today
                                ? 'border-[#d4a853] text-[#b8832e] dark:text-[#d4b05a]'
                                : 'border-[#ded8cc] text-[#b8b2a6] dark:border-[#34312d] dark:text-[#6f6a61]'
                          }`}
                        >
                          {day.checked ? <Check className="size-3.5" /> : day.today ? '•' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#ded8cc] bg-white p-5 dark:border-[#34312d] dark:bg-[#171614] sm:col-span-2 xl:col-span-1">
                  <h3 className="text-center text-xs font-bold uppercase tracking-[0.12em] text-[#7a7060] dark:text-[#9f998c]">{v.activeTopic}</h3>
                  {activeDeck ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeDeck.premium && !isPro) {
                          setShowProGate(true)
                          return
                        }
                        router.push(`/dashboard/vocabulary/${activeDeck.slug}`)
                      }}
                      className="mt-4 w-full rounded-xl border border-[#eee5d5] bg-[#faf8f3] p-3 text-left transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] dark:border-[#34312d] dark:bg-[#12110f] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{localizedDeckTitle(activeDeck, v)}</p>
                          <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{activeDeck.learnedWords}/{activeDeck.wordCount} {v.cards}</p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-[#b8832e] dark:text-[#d4b05a]" />
                      </div>
                      <Progress
                        value={activeDeck.completionPercentage}
                        className="mt-3 h-1.5 [&_[data-slot=progress-indicator]]:bg-[#d4a853]"
                      />
                    </button>
                  ) : (
                    <p className="mt-4 text-center text-sm text-[#7a7060] dark:text-[#9f998c]">{v.noActiveTopic}</p>
                  )}
                </div>
              </aside>

              <div className="flex flex-col gap-4 rounded-2xl border border-[#ded8cc] bg-white p-4 sm:flex-row sm:items-center sm:justify-between xl:col-span-2 dark:border-[#34312d] dark:bg-[#171614]">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.reviewToday}</h3>
                    <p className="mt-0.5 text-xs text-[#7a7060] dark:text-[#9f998c]">
                      {stats.notMastered > 0
                        ? `${stats.notMastered} ${v.reviewNeeded} · ${v.aboutMinutes} ${reviewMinutes} ${v.minutes}`
                        : v.reviewCompleted}
                    </p>
                  </div>
                </div>
                <Button
                  disabled={stats.notMastered === 0}
                  onClick={() => router.push('/dashboard/vocabulary/review')}
                  className="h-10 min-w-32 gap-2 rounded-xl bg-[#d4a853] px-5 font-bold text-white shadow-none hover:bg-[#bd913d] disabled:opacity-50 dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#e1bd6d]"
                >
                  {v.start}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#1a1a2e] dark:text-[#e8e3d8]">
                    {v.vocabularyList}
                  </h2>
                  <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">
                    {v.vocabularyListSubtitle}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full border-[#ded8cc] px-3 py-1 text-[#7a7060] dark:border-[#34312d] dark:text-[#9f998c]">
                  {filteredWords.length} {v.words}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9f998c]" />
                <Input
                  value={wordSearch}
                  onChange={(event) => setWordSearch(event.target.value)}
                  placeholder={contentLanguage === 'vi'
                    ? (lang === 'vi' ? 'Tìm từ vựng hoặc nghĩa tiếng Việt...' : 'Search words or Vietnamese meanings...')
                    : (lang === 'vi' ? 'Tìm từ vựng hoặc định nghĩa tiếng Anh...' : 'Search words or English definitions...')}
                  className="h-10 rounded-xl border-[#ded8cc] bg-white pl-11 pr-10 text-sm shadow-none focus-visible:border-[#d4a853] focus-visible:ring-[#d4a853]/20 dark:border-[#34312d] dark:bg-[#171614]"
                />
                {wordSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setWordSearch('')}
                    className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 rounded-lg text-[#9f998c]"
                  >
                    <span className="text-lg">×</span>
                  </Button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { value: 'all' as const, label: v.all },
                  { value: 'unlearned' as const, label: v.unlearned },
                  { value: 'not-mastered' as const, label: v.notMastered },
                  { value: 'mastered' as const, label: v.mastered },
                  { value: 'saved' as const, label: v.saved },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWordFilter(filter.value)}
                    className={
                      wordFilter === filter.value
                        ? 'h-8 rounded-full border-[#d4a853] bg-[#fff8e8] px-4 font-semibold text-[#9a6b18] shadow-none hover:bg-[#fff1cf] dark:border-[#d4b05a] dark:bg-[#2a2115] dark:text-[#d4b05a]'
                        : 'h-8 rounded-full border-[#ded8cc] bg-white px-4 font-medium text-[#4b5563] shadow-none hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#b8b2a6] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]'
                    }
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              <div className="mt-4 space-y-2.5">
                {wordsLoading &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-[6.5rem] rounded-xl" />
                  ))}

                {!wordsLoading && filteredWords.length === 0 && (
                  <div className="rounded-xl border border-[#ded8cc] bg-white px-6 py-12 text-center dark:border-[#34312d] dark:bg-[#171614]">
                    <BookOpen className="mx-auto size-8 text-[#b9b1a2]" />
                    <p className="mt-3 text-sm font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.noVocabularyFound}</p>
                    <p className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{v.noVocabularyFoundSubtitle}</p>
                  </div>
                )}

                {!wordsLoading &&
                  filteredWords.slice(0, wordListLimit).map((word) => {
                    const saved = savedWordsByName.has(word.word.trim().toLocaleLowerCase('en'))
                    const status =
                      word.learningStatus === 'MASTERED'
                        ? { label: v.mastered, color: '#3f8f65' }
                        : word.learningStatus === 'NOT_MASTERED'
                          ? { label: v.notMastered, color: '#b8832e' }
                          : { label: v.unlearned, color: '#7a7060' }
                    return (
                      <div
                        key={word.id}
                        className="relative flex flex-col gap-3 rounded-xl border border-[#ded8cc] bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#34312d] dark:bg-[#171614]"
                      >
                        <span
                          className="absolute bottom-4 left-4 top-4 w-0.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <div className="min-w-0 pl-4">
                          <p className="truncate text-[15px] font-bold leading-5 text-[#1a1a2e] dark:text-[#e8e3d8]">{word.word}</p>
                          <p className="text-[11px] leading-4 text-[#7a7060] dark:text-[#9f998c]">{word.ipaUs ?? word.ipaUk ?? v.noPhonetic}</p>
                          <p className="mt-1 text-[13px] leading-4 text-[#4b5563] dark:text-[#b8b2a6]">
                            {contentLanguage === 'vi' ? word.vietnameseTranslation : word.englishDefinition}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pl-4 sm:pl-0">
                          <Badge
                            variant="outline"
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                            style={{ borderColor: `${status.color}55`, color: status.color }}
                          >
                            {status.label}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={savingWordId === word.id}
                            onClick={() => void toggleSavedWord(word)}
                            aria-label={saved ? v.unsaveWord : v.saveWord}
                            className={`size-8 rounded-lg shadow-none ${
                              saved
                                ? 'border-[#d4a853] bg-[#fff8e8] text-[#b8832e] hover:bg-[#fff1cf] dark:border-[#d4b05a] dark:bg-[#2a2115] dark:text-[#d4b05a]'
                                : 'border-[#ded8cc] bg-white text-[#7a7060] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#b8832e] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6]'
                            }`}
                          >
                            <Heart className={`size-3.5 ${saved ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => playWord(word)}
                            aria-label={`${v.playWord} ${word.word}`}
                            className="size-8 rounded-lg border-[#ded8cc] bg-white text-[#4b5563] shadow-none hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#b8832e] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6]"
                          >
                            <Volume2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {!wordsLoading && filteredWords.length > wordListLimit && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWordListLimit((current) => current + 8)}
                    className="rounded-xl border-[#ded8cc] bg-white px-6 text-[#4b5563] shadow-none hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#b8b2a6]"
                  >
                    {v.showMore} {Math.min(8, filteredWords.length - wordListLimit)} {v.words}
                  </Button>
                </div>
              )}
            </section>

            <section className="mb-7 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={v.searchTopicPlaceholder}
                  className="h-10 w-full rounded-xl border border-[#ded8cc] bg-white pl-11 pr-10 text-sm text-gray-900 shadow-none placeholder:text-gray-400 focus-visible:border-[#d4a853] focus-visible:ring-[#d4a853]/20 dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-100 dark:placeholder:text-gray-500"
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
                    className="flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
                  >
                    <span>{categoryFilters.length === 0 ? v.topicLabel : `${v.topicLabel} (${categoryFilters.length})`}</span>
                    <ChevronDown className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#f5f3ef] dark:bg-[#1a1917]">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{v.selectTopic}</span>
                    {categoryFilters.length > 0 && (
                      <button onClick={() => setCategoryFilters([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                        {v.clearAll}
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
                        {localizedCategory(item.name, v)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
                  >
                    <span>{progressFilters.length === 0 ? v.progressLabel : `${v.progressLabel} (${progressFilters.length})`}</span>
                    {progressFilters.length > 0 && (
                      <span className="flex items-center gap-1">
                        {progressFilters.slice(0, 3).map((filter) => {
                          const option = progressOptions.find((item) => item.value === filter)
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
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{v.selectProgress}</span>
                    {progressFilters.length > 0 && (
                      <button onClick={() => setProgressFilters([])} className="text-xs hover:underline" style={{ color: '#d4a853' }}>
                        {v.clearAll}
                      </button>
                    )}
                  </div>
                  {progressOptions.map(({ value, label, color }) => (
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
                    {localizedCategory(topic, v)}
                    <button onClick={() => setCategoryFilters((current) => current.filter((item) => item !== topic))} className="ml-1 hover:opacity-70">×</button>
                  </Badge>
                ))}
                {progressFilters.map((filter) => {
                  const option = progressOptions.find((item) => item.value === filter)
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
                  {v.clearAll}
                </button>
              </div>
            )}

            {loading && <LoadingGrid />}

            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-white px-6 py-12 text-center dark:border-red-950 dark:bg-[#171614]">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" className="mt-4" onClick={loadDecks}>
                  {v.retry}
                </Button>
              </div>
            )}

            {!loading && !error && filteredCategories.length === 0 && (
              <div className="rounded-lg border border-[#e5e3df] bg-white px-6 py-16 text-center dark:border-[#2e2c29] dark:bg-[#171614]">
                <BookOpen className="mx-auto size-9 text-[#b9b1a2]" />
                <h2 className="mt-3 text-sm font-semibold">{v.noFilteredDecksTitle}</h2>
                <p className="mt-1 text-xs text-[#7a7060]">{v.noFilteredDecksSubtitle}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                {filteredCategories.map((item) => (
                  <section key={item.name}>
                    <h2 className="mb-3 text-sm font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">
                      {localizedCategory(item.name, v)}{' '}
                      <span className="font-normal text-[#9ca3af]">({item.decks.length} {v.decks})</span>
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {item.decks.map((deck) => (
                      <DeckCard
                        key={deck.id}
                        deck={deck}
                        lang={lang}
                        v={v}
                        canAccessPro={isPro}
                        onLocked={() => setShowProGate(true)}
                      />
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
