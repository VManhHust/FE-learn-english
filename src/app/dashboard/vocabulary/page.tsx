'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  BookMarked,
  Brain,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  CircleHelp,
  Clock,
  Crown,
  Heart,
  Eye,
  List,
  PenLine,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  WandSparkles,
  Users,
  Trash2,
  X,
} from 'lucide-react'
import {
  ArrowCounterClockwise,
  BookBookmark,
  CalendarCheck,
  CardsThree,
  Target as PhosphorTarget,
  Trophy as PhosphorTrophy,
} from '@phosphor-icons/react'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { VocabularySectionNav } from '@/components/vocabulary/VocabularySectionNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getVocabularyDeckCover } from '@/config/vocabularyDeckCovers'
import { playAnswerSound } from '@/lib/vocabularyAnswerSound'
import { playVocabularyPronunciation } from '@/lib/vocabularyPronunciation'
import { cn } from '@/lib/utils'

type ProgressFilter = 'all' | 'not-started' | 'learning' | 'completed'
type WordFilter = 'all' | 'unlearned' | 'not-mastered' | 'mastered' | 'saved'

const POS_LABELS: Record<string, { vi: string; en: string }> = {
  noun: { vi: 'Danh từ', en: 'Noun' },
  verb: { vi: 'Động từ', en: 'Verb' },
  adjective: { vi: 'Tính từ', en: 'Adjective' },
  adverb: { vi: 'Trạng từ', en: 'Adverb' },
  phrase: { vi: 'Cụm từ', en: 'Phrase' },
  preposition: { vi: 'Giới từ', en: 'Preposition' },
  conjunction: { vi: 'Liên từ', en: 'Conjunction' },
  pronoun: { vi: 'Đại từ', en: 'Pronoun' },
}

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

function getActivityLevel(count: number) {
  if (count >= 9) return 'high'
  if (count >= 4) return 'medium'
  if (count > 0) return 'low'
  return 'none'
}

function formatActivityDate(key: string, lang: 'vi' | 'en') {
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${key}T00:00:00`))
}

function highlightWordInExample(example: string, word: string) {
  const normalizedWord = word.trim()
  if (!normalizedWord) return example

  const escapedWord = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = example.split(new RegExp(`(${escapedWord})`, 'gi'))

  return parts.map((part, index) =>
    part.toLocaleLowerCase('en') === normalizedWord.toLocaleLowerCase('en') ? (
      <mark
        key={`${part}-${index}`}
        className="bg-transparent p-0 font-semibold text-[#b8832e] dark:text-[#d4b05a]"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  )
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
  const cover = getVocabularyDeckCover(deck.slug)
  const openDeck = () => {
    if (deck.premium && !canAccessPro) {
      onLocked()
      return
    }
    router.push(`/dashboard/vocabulary/${deck.id}`)
  }

  return (
    <article className="flex min-h-[300px] flex-col overflow-hidden rounded-lg border border-[#e5e3df] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#2e2c29] dark:bg-[#171614]">
      <button
        type="button"
        onClick={openDeck}
        className="relative flex h-40 items-center justify-center px-6 text-center text-white"
        style={{
          backgroundColor: cover?.backgroundColor ?? deck.coverColor,
          ...(cover
            ? {
                backgroundImage: `${cover.overlay === false ? '' : 'linear-gradient(180deg, rgba(20, 22, 50, 0.12) 0%, rgba(20, 22, 50, 0.58) 100%), '}url("${cover.url}")`,
                backgroundPosition: cover.position ?? 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: cover.fit ?? 'cover',
              }
            : {}),
        }}
      >
        {!cover && <span className="max-w-[240px] text-lg font-bold leading-snug">{localizedDeckTitle(deck, v)}</span>}
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
  const steps = [
    { icon: Check, label: v.spacedStep1 },
    { icon: Clock, label: v.spacedStep2 },
    { icon: RotateCcw, label: v.spacedStep3 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#ead9b5] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] dark:border-[#3c3326] dark:bg-[#11100e]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4d8] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]">
              <CircleHelp className="size-5" />
            </span>
            <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-[#f4efe6]">{v.spacedTitle}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mr-3 size-9 rounded-full text-[#7a7060] hover:bg-[#f5f0e8] hover:text-[#9a6b18] dark:text-[#aaa497] dark:hover:bg-white/5 dark:hover:text-[#d4b05a]"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="border-t border-[#eee5d5] px-5 py-5 dark:border-[#292621] sm:px-6">
          <p className="text-sm leading-6 text-[#4b5563] dark:text-[#c8c1b3]">
            <strong className="font-bold text-[#1a1a2e] dark:text-[#f4efe6]">Spaced Repetition</strong> {v.spacedDesc}
          </p>

          <div className="mt-5 space-y-3">
            {steps.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-[#eee5d5] bg-[#faf8f3] px-3 py-3 dark:border-[#34312d] dark:bg-[#171614]">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d4a853]/12 text-[#b8832e] dark:bg-[#d4b05a]/15 dark:text-[#d4b05a]">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium leading-6 text-[#374151] dark:text-[#d8d4ca]">{label}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-xl bg-[#fff8e8] px-4 py-3 text-xs leading-5 text-[#7a7060] dark:bg-[#211b12] dark:text-[#b8ad9b]">
            {v.spacedNote}
          </p>

          <Button
            onClick={onClose}
            className="mt-5 h-11 w-full rounded-xl bg-[#d4a853] text-sm font-bold text-white shadow-sm hover:bg-[#bd9140] dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#c29f4f]"
          >
            {v.gotIt}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SavedWordsView({ onBack, v }: { onBack: () => void; v: typeof vocabularyI18n }) {
  const router = useRouter()
  const { lang } = useLang()
  const [words, setWords] = useState<VocabularyBankEntry[]>([])
  const [wordDetails, setWordDetails] = useState<VocabularyWordCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'flashcard' | 'write'>('list')
  const [search, setSearch] = useState('')
  const [speakingWord, setSpeakingWord] = useState<string | null>(null)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [flashcardFeedback, setFlashcardFeedback] = useState<'mastered' | 'not-mastered' | null>(null)
  const [masteredIds, setMasteredIds] = useState<Set<number>>(new Set())
  const [writeIndex, setWriteIndex] = useState(0)
  const [writeAnswer, setWriteAnswer] = useState('')
  const [writeResult, setWriteResult] = useState<'correct' | 'incorrect' | null>(null)

  const copy = lang === 'vi'
    ? {
        search: 'Tìm trong danh sách từ...',
        saved: 'từ đã lưu',
        listHint: 'Chạm vào loa để nghe phát âm. Bạn có thể xóa những từ không còn muốn ôn.',
        flashHint: 'Lật thẻ để xem nghĩa, sau đó tự đánh giá mức độ ghi nhớ.',
        writeHint: 'Nhìn nghĩa hoặc nghe phát âm rồi viết lại từ tiếng Anh.',
        front: 'Mặt trước',
        back: 'Mặt sau',
        tapToFlip: 'Nhấn vào thẻ để lật',
        notYet: 'Chưa thành thạo',
        remembered: 'Thành thạo',
        shuffle: 'Trộn thẻ',
        previous: 'Trước',
        next: 'Tiếp',
        meaningMissing: 'Chưa có nghĩa trong kho từ vựng',
        listenAndWrite: 'Nghe phát âm và viết lại từ bạn nghe được',
        yourAnswer: 'Nhập từ tiếng Anh...',
        correct: 'Chính xác!',
        answer: 'Đáp án',
        nextQuestion: 'Câu tiếp theo',
        known: 'đã nhớ',
        definition: 'Định nghĩa',
        wordType: 'Loại từ',
        hint: 'Gợi ý',
        example: 'Ví dụ',
        noType: 'Chưa có loại từ',
        typeHere: 'Nhập từ',
      }
    : {
        search: 'Search saved vocabulary...',
        saved: 'saved words',
        listHint: 'Use the speaker to hear pronunciation. Remove words you no longer want to review.',
        flashHint: 'Flip each card to reveal its meaning, then rate your recall.',
        writeHint: 'Read the meaning or listen to the pronunciation, then type the English word.',
        front: 'Front',
        back: 'Back',
        tapToFlip: 'Tap the card to flip',
        notYet: 'Not mastered',
        remembered: 'Mastered',
        shuffle: 'Shuffle',
        previous: 'Previous',
        next: 'Next',
        meaningMissing: 'No definition is available in the vocabulary bank',
        listenAndWrite: 'Listen and type the English word you hear',
        yourAnswer: 'Type the English word...',
        correct: 'Correct!',
        answer: 'Answer',
        nextQuestion: 'Next question',
        known: 'mastered',
        definition: 'Definition',
        wordType: 'Part of speech',
        hint: 'Hint',
        example: 'Example',
        noType: 'No part of speech yet',
        typeHere: 'Type the word',
      }

  const detailMap = useMemo(() => {
    return new Map(wordDetails.map((item) => [item.word.trim().toLowerCase(), item]))
  }, [wordDetails])

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return words
    return words.filter((entry) => {
      const detail = detailMap.get(entry.word.trim().toLowerCase())
      return [
        entry.word,
        detail?.vietnameseTranslation,
        detail?.englishDefinition,
      ].some((value) => value?.toLowerCase().includes(query))
    })
  }, [detailMap, search, words])

  const flashcardEntry = words.length > 0 ? words[flashcardIndex % words.length] : null
  const flashcardDetail = flashcardEntry
    ? detailMap.get(flashcardEntry.word.trim().toLowerCase())
    : undefined
  const writeEntry = words.length > 0 ? words[writeIndex % words.length] : null
  const writeDetail = writeEntry
    ? detailMap.get(writeEntry.word.trim().toLowerCase())
    : undefined
  const writePrompt = writeDetail?.vietnameseTranslation || writeDetail?.englishDefinition
  const writeWord = writeEntry?.word ?? ''
  const normalizedWriteAnswer = writeAnswer.trim().toLocaleLowerCase()
  const normalizedWriteWord = writeWord.trim().toLocaleLowerCase()
  const writeMaskLetters = Array.from(writeWord).map((letter, index) => ({
    letter,
    visible: letter === ' ' || letter === '-' || letter === "'" || normalizedWriteAnswer[index] === letter.toLocaleLowerCase(),
    fixed: letter === ' ' || letter === '-' || letter === "'",
  }))
  const writeHintLetters = writeWord
    ? `${writeWord[0]?.toLocaleUpperCase() ?? ''}${writeWord.length > 1 ? ' · ' : ''}${writeWord.length} ${lang === 'vi' ? 'chữ cái' : 'letters'}`
    : ''
  const writePartOfSpeech = writeDetail?.partOfSpeech
    ? (lang === 'vi' ? POS_LABELS[writeDetail.partOfSpeech]?.vi : POS_LABELS[writeDetail.partOfSpeech]?.en) ?? writeDetail.partOfSpeech
    : copy.noType

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [saved, details] = await Promise.all([
        vocabularyBankApi.list(0, 100),
        vocabularyApi.getWords().catch(() => [] as VocabularyWordCard[]),
      ])
      setWords(saved.content)
      setWordDetails(details)
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

  useEffect(() => {
    if (flashcardIndex >= words.length) setFlashcardIndex(0)
    if (writeIndex >= words.length) setWriteIndex(0)
  }, [flashcardIndex, writeIndex, words.length])

  const handleDelete = async (id: number) => {
    try {
      await vocabularyBankApi.delete(id)
      setWords((current) => current.filter((word) => word.id !== id))
      setMasteredIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    } catch {}
  }

  const handleSpeak = (word: string) => {
    const normalizedWord = word.trim().toLowerCase()
    setSpeakingWord(normalizedWord)
    void playVocabularyPronunciation({ word, accent: 'US' }).finally(() => {
      setSpeakingWord((current) => (current === normalizedWord ? null : current))
    })
  }

  const dictionaryUrl = (word: string, dictionary: 'oxford' | 'cambridge') => {
    const normalized = encodeURIComponent(word.toLowerCase().trim())
    return dictionary === 'oxford'
      ? 'https://www.oxfordlearnersdictionaries.com/definition/english/' + normalized
      : 'https://dictionary.cambridge.org/dictionary/english/' + normalized
  }

  const moveFlashcard = (direction: number) => {
    if (words.length === 0) return
    setFlashcardFeedback(null)
    setFlashcardIndex((current) => (current + direction + words.length) % words.length)
    setFlipped(false)
  }

  const rateFlashcard = (remembered: boolean) => {
    if (!flashcardEntry) return
    setFlashcardFeedback(remembered ? 'mastered' : 'not-mastered')
    setMasteredIds((current) => {
      const next = new Set(current)
      if (remembered) next.add(flashcardEntry.id)
      else next.delete(flashcardEntry.id)
      return next
    })
    window.setTimeout(() => moveFlashcard(1), 160)
  }

  const shuffleFlashcards = () => {
    if (words.length < 2) return
    setFlashcardFeedback(null)
    let next = flashcardIndex
    while (next === flashcardIndex) next = Math.floor(Math.random() * words.length)
    setFlashcardIndex(next)
    setFlipped(false)
  }

  const studySavedCard = (entry: VocabularyBankEntry) => {
    const index = words.findIndex((word) => word.id === entry.id)
    if (index >= 0) setFlashcardIndex(index)
    setFlipped(false)
    setActiveTab('flashcard')
  }

  const nextWritingQuestion = () => {
    if (words.length === 0) return
    setWriteIndex((current) => (current + 1) % words.length)
    setWriteAnswer('')
    setWriteResult(null)
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex items-start gap-2 sm:mb-7 sm:items-center sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="size-10 shrink-0 rounded-xl text-[#7a7060] hover:bg-white hover:text-[#9a6b18] dark:text-[#b8b2a6] dark:hover:bg-[#211d16]"
            aria-label={lang === 'vi' ? 'Quay lại' : 'Go back'}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-3 text-left">
            <div>
              <h1 className="text-xl font-bold text-[#1a1a2e] sm:text-2xl dark:text-[#eee8dc]">{v.myVocabTitle}</h1>
              <p className="mt-1 text-sm text-[#7a7060] dark:text-[#9f998c]">{v.myVocabSubtitle}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex w-full flex-col gap-5">
          <TabsList className="mx-auto grid h-auto min-h-12 w-full max-w-xl grid-cols-3 rounded-2xl border border-[#e4dccf] bg-[#eeeae2] p-1 shadow-inner dark:border-[#34312d] dark:bg-[#161410]">
            <TabsTrigger value="list" className="h-10 gap-2 rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-[#9a6b18] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#2a2115] dark:data-[state=active]:text-[#d4b05a]">
              <List className="size-4" /> {v.tabList}
            </TabsTrigger>
            <TabsTrigger value="flashcard" className="h-10 gap-2 rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-[#9a6b18] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#2a2115] dark:data-[state=active]:text-[#d4b05a]">
              <Brain className="size-4" /> {v.tabFlashcard}
            </TabsTrigger>
            <TabsTrigger value="write" className="h-10 gap-2 rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-[#9a6b18] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#2a2115] dark:data-[state=active]:text-[#d4b05a]">
              <PenLine className="size-4" /> {v.tabWrite}
            </TabsTrigger>
          </TabsList>

          {loading && (
            <Card className="mx-auto w-full max-w-3xl border-[#ded8cc] bg-white dark:border-[#34312d] dark:bg-[#171614]">
              <CardContent className="py-16 text-center text-sm text-[#7a7060]">{v.loadingVocab}</CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="mx-auto w-full max-w-3xl border-red-200 bg-white dark:border-red-950 dark:bg-[#171614]">
              <CardContent className="py-16 text-center">
                <p className="mb-4 text-sm text-red-500">{error}</p>
                <Button onClick={load}>{v.retry}</Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && words.length === 0 && (
            <Card className="mx-auto w-full max-w-3xl border-[#ded8cc] bg-white dark:border-[#34312d] dark:bg-[#171614]">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-[#fff8e8] text-4xl dark:bg-[#2a2115]">🦜</div>
                <CardTitle className="text-base">{v.noWordsTitle}</CardTitle>
                <CardDescription className="mt-2 max-w-sm">{v.noWordsSubtitle}</CardDescription>
              </CardContent>
            </Card>
          )}

          {!loading && !error && words.length > 0 && (
            <>
              <TabsContent value="list" className="mt-0">
                <div className="mx-auto mb-5 max-w-2xl text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-[#eee8dc]">{v.tabList}</h2>
                    <span className="text-sm text-[#7a7060] dark:text-[#9f998c]">({words.length} {copy.saved})</span>
                  </div>
                  <div className="relative mx-auto mt-4 max-w-xl">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9f998c]" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={copy.search}
                      className="h-11 rounded-xl border-[#ded8cc] bg-white pl-10 shadow-sm focus-visible:border-[#d4a853] dark:border-[#594526] dark:bg-[#191713] dark:focus-visible:border-[#d4b05a]"
                    />
                  </div>
                </div>

                <div className="mt-8 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredWords.map((entry) => {
                    const detail = detailMap.get(entry.word.trim().toLowerCase())
                    const isEntrySpeaking = speakingWord === entry.word.trim().toLowerCase()
                    const partOfSpeech = detail?.partOfSpeech
                      ? (lang === 'vi' ? POS_LABELS[detail.partOfSpeech]?.vi : POS_LABELS[detail.partOfSpeech]?.en) ?? detail.partOfSpeech
                      : null
                    const savedDate = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(entry.addedAt))
                    return (
                      <Card key={entry.id} className="group w-full gap-0 overflow-hidden rounded-2xl border-[#dfc994] bg-gradient-to-br from-white via-[#fffdf8] to-[#fff5dc] py-0 shadow-[0_14px_34px_rgba(91,67,23,0.10)] transition-all duration-200 hover:-translate-y-1 hover:border-[#d4a853] hover:shadow-[0_20px_44px_rgba(91,67,23,0.16)] dark:border-[#66502b] dark:bg-gradient-to-br dark:from-[#211e18] dark:via-[#191713] dark:to-[#2a2115] dark:shadow-[0_14px_36px_rgba(0,0,0,0.24)] dark:hover:border-[#d4b05a] dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
                        <CardHeader className="relative px-5 pb-4 pt-5">
                          <div className="absolute right-4 top-4 flex items-center gap-2">
                            <Badge variant="outline" className="hidden rounded-full border-[#dfc994] bg-white/60 text-[10px] text-[#9a6b18] dark:bg-black/10 dark:text-[#d4b05a] sm:inline-flex">
                              <CalendarDays className="mr-1 size-3" />
                              {lang === 'vi' ? 'Đã lưu' : 'Saved'} {savedDate}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry.id)}
                              className="size-8 shrink-0 rounded-lg text-[#aaa397] opacity-70 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
                              aria-label={v.deleteTitle}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="min-w-0 pr-16 sm:pr-40">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="break-words text-2xl font-black tracking-tight text-[#1a1a2e] dark:text-[#eee8dc]">{entry.word}</CardTitle>
                              {partOfSpeech && (
                                <Badge variant="outline" className="rounded-full border-[#dfc994] bg-white/60 text-[10px] font-bold text-[#9a6b18] dark:bg-black/10 dark:text-[#d4b05a]">
                                  {partOfSpeech}
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="mt-2 text-xs text-[#9f998c]">
                              {detail?.ipaUs ?? detail?.ipaUk ?? v.noPhonetic}
                            </CardDescription>
                          </div>
                          <div className="mt-5 grid gap-3">
                            <div className="rounded-2xl border border-[#eee5d5] bg-white/70 p-4 dark:border-[#594526] dark:bg-black/15">
                              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#9a6b18] dark:text-[#d4b05a]">
                                {lang === 'vi' ? 'Định nghĩa' : 'Definition'}
                              </p>
                              <p className="text-sm leading-6 text-[#374151] dark:text-[#d8d1c3]">
                                {detail?.englishDefinition || copy.meaningMissing}
                              </p>
                              {detail?.vietnameseTranslation && (
                                <p className="mt-3 border-t border-dashed border-[#dfc994] pt-3 text-sm leading-6 text-[#4b5563] dark:border-[#66502b] dark:text-[#b8b2a6]">
                                  {detail.vietnameseTranslation}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="grid grid-cols-2 gap-2 border-t border-[#eee5d5] bg-[#faf8f3] px-4 py-3 sm:grid-cols-4 dark:border-[#594526] dark:bg-black/15">
                          <Button onClick={() => studySavedCard(entry)} className="h-9 min-w-0 gap-1.5 rounded-lg bg-[#d4a853] px-2 text-xs font-bold text-white hover:bg-[#bd913d] dark:text-[#171614]">
                            <Brain className="size-3.5" />
                            <span className="truncate">{lang === 'vi' ? 'Học thẻ này' : 'Study card'}</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleSpeak(entry.word)} className="h-9 min-w-0 gap-1.5 rounded-lg border-[#ded8cc] bg-white px-2 text-xs font-semibold hover:border-[#d4a853] hover:text-[#9a6b18] dark:border-[#594526] dark:bg-black/15 dark:text-[#d8d1c3] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]">
                            <Volume2 className="size-3.5" />
                            <span className="truncate">{isEntrySpeaking ? v.playing : v.pronounce}</span>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="h-9 min-w-0 gap-1.5 rounded-lg border-[#ded8cc] bg-white px-2 text-xs font-semibold text-[#4b5563] hover:border-[#d4a853] hover:text-[#9a6b18] dark:border-[#594526] dark:bg-black/15 dark:text-[#d8d1c3] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]">
                            <a href={dictionaryUrl(entry.word, 'oxford')} target="_blank" rel="noreferrer">
                              <BookOpen className="size-3.5" />
                              <span className="truncate">Oxford</span>
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="h-9 min-w-0 gap-1.5 rounded-lg border-[#ded8cc] bg-white px-2 text-xs font-semibold text-[#4b5563] hover:border-[#d4a853] hover:text-[#9a6b18] dark:border-[#594526] dark:bg-black/15 dark:text-[#d8d1c3] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]">
                            <a href={dictionaryUrl(entry.word, 'cambridge')} target="_blank" rel="noreferrer">
                              <BookMarked className="size-3.5" />
                              <span className="truncate">Cambridge</span>
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="flashcard" className="mt-0">
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-[#eee8dc]">{v.tabFlashcard}</h2>
                  <p className="mt-1 text-xs text-[#9f998c]">{copy.flashHint}</p>
                  <div className="mt-4 flex items-center justify-between text-xs font-medium text-[#7a7060] dark:text-[#9f998c]">
                    <span>{flashcardIndex + 1}/{words.length}</span>
                    <span>{masteredIds.size} {copy.known}</span>
                  </div>
                  <Progress value={((flashcardIndex + 1) / words.length) * 100} className="mt-2 h-1.5 overflow-hidden [&_[data-slot=progress-indicator]]:bg-[#d4a853] [&_[data-slot=progress-indicator]]:transition-transform [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out" />

                  {flashcardEntry && (
                    <div className="mt-5 h-[290px] w-full sm:h-[330px] [perspective:1200px]">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={copy.tapToFlip}
                        onClick={() => setFlipped((current) => !current)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setFlipped((current) => !current)
                          }
                        }}
                        className={cn(
                          'relative size-full cursor-pointer rounded-xl transition-all duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:focus-visible:ring-offset-[#0f0e0c]',
                          flipped && '[transform:rotateY(180deg)] hover:[transform:translateY(-4px)_rotateY(180deg)]',
                          flashcardFeedback === 'mastered' && 'ring-2 ring-emerald-400/70 shadow-[0_24px_70px_rgba(16,185,129,0.20)]',
                          flashcardFeedback === 'not-mastered' && 'ring-2 ring-[#e4a29a]/80 shadow-[0_24px_70px_rgba(173,91,77,0.16)]',
                        )}
                      >
                        <Card className="absolute inset-0 size-full justify-center overflow-hidden border-[#dfc994] bg-gradient-to-br from-white via-[#fffdf8] to-[#fff5dc] shadow-[0_18px_50px_rgba(91,67,23,0.13)] transition-shadow hover:shadow-[0_22px_56px_rgba(91,67,23,0.18)] [backface-visibility:hidden] dark:border-[#66502b] dark:from-[#211e18] dark:via-[#191713] dark:to-[#2a2115]">
                          <CardContent className="flex h-full flex-col items-center justify-center px-4 py-6 text-center sm:px-8 sm:py-10">
                            <Badge variant="outline" className="mb-6 rounded-full border-[#dfc994] bg-white/60 text-[#9a6b18] dark:bg-black/10 dark:text-[#d4b05a]">
                              {copy.front}
                            </Badge>
                            <p className="break-words text-3xl font-black tracking-tight text-[#1a1a2e] sm:text-4xl dark:text-[#eee8dc]">{flashcardEntry.word}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleSpeak(flashcardEntry.word)
                              }}
                              className="mt-5 gap-2 rounded-full text-[#9a6b18] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 active:translate-y-0 active:scale-95 dark:text-[#d4b05a]"
                            >
                              <Volume2 className={cn('size-4 transition-transform duration-200', speakingWord === flashcardEntry.word.trim().toLowerCase() && 'scale-125 text-[#d4a853]')} /> {v.pronounce}
                            </Button>
                            <p className="mt-7 flex items-center gap-1.5 text-xs text-[#9f998c]"><Eye className="size-3.5" /> {copy.tapToFlip}</p>
                          </CardContent>
                        </Card>

                        <Card className="absolute inset-0 size-full justify-center overflow-hidden border-[#dfc994] bg-gradient-to-br from-[#fff9e9] via-white to-[#f8efe0] shadow-[0_18px_50px_rgba(91,67,23,0.13)] [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-[#66502b] dark:from-[#2a2115] dark:via-[#191713] dark:to-[#211e18]">
                          <CardContent className="flex h-full flex-col items-center justify-center px-8 py-8 text-center">
                            <Badge variant="outline" className="mb-6 rounded-full border-[#dfc994] bg-white/60 text-[#9a6b18] dark:bg-black/10 dark:text-[#d4b05a]">
                              {copy.back}
                            </Badge>
                            <p className="text-2xl font-bold text-[#1a1a2e] dark:text-[#eee8dc]">
                              {flashcardDetail?.vietnameseTranslation || flashcardDetail?.englishDefinition || copy.meaningMissing}
                            </p>
                            {flashcardDetail?.englishDefinition && flashcardDetail?.vietnameseTranslation && (
                              <p className="mt-4 max-w-lg text-sm leading-6 text-[#7a7060] dark:text-[#b8b2a6]">{flashcardDetail.englishDefinition}</p>
                            )}
                            {flashcardDetail?.exampleSentence && (
                              <p className="mt-5 max-w-lg rounded-xl bg-white/60 px-4 py-3 text-sm italic text-[#657084] dark:bg-black/10 dark:text-[#aaa397]">
                                “{flashcardDetail.exampleSentence}”
                              </p>
                            )}
                            <p className="mt-7 flex items-center gap-1.5 text-xs text-[#9f998c]"><Eye className="size-3.5" /> {copy.tapToFlip}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => moveFlashcard(-1)} className="size-10 rounded-xl transition-all duration-200 hover:-translate-x-0.5 active:scale-95 motion-reduce:transform-none"><ChevronLeft className="size-4" /></Button>
                    <Button variant="outline" onClick={() => rateFlashcard(false)} className={cn('group h-10 rounded-xl border-[#e4c5bd] text-[#ad5b4d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none dark:border-[#6a3831] dark:hover:bg-red-950/30', flashcardFeedback === 'not-mastered' && 'bg-red-50 ring-2 ring-red-200 dark:bg-red-950/30 dark:ring-red-900')}><RotateCcw className={cn('size-4 transition-transform duration-300 group-hover:-rotate-12', flashcardFeedback === 'not-mastered' && '-rotate-45 scale-110')} /> {copy.notYet}</Button>
                    <Button onClick={() => rateFlashcard(true)} className={cn('group h-10 rounded-xl bg-[#d4a853] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#bd913d] hover:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none dark:text-[#171614]', flashcardFeedback === 'mastered' && 'ring-2 ring-emerald-300 shadow-[0_10px_26px_rgba(16,185,129,0.22)]')}><Check className={cn('size-4 transition-transform duration-200 group-hover:scale-110', flashcardFeedback === 'mastered' && 'scale-125')} /> {copy.remembered}</Button>
                    <Button variant="outline" size="icon" onClick={() => moveFlashcard(1)} className="size-10 rounded-xl transition-all duration-200 hover:translate-x-0.5 active:scale-95 motion-reduce:transform-none"><ChevronRight className="size-4" /></Button>
                    <Button variant="ghost" onClick={shuffleFlashcards} className="group h-10 rounded-xl text-[#7a7060] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"><Shuffle className="size-4 transition-transform duration-300 group-hover:rotate-12" /> {copy.shuffle}</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="write" className="mt-0">
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-[#eee8dc]">{v.tabWrite}</h2>
                  <p className="mt-1 text-xs text-[#9f998c]">{copy.writeHint}</p>
                  <div className="mt-4 flex items-center justify-between text-xs font-medium text-[#7a7060] dark:text-[#9f998c]">
                    <span>{writeIndex + 1}/{words.length}</span>
                  </div>
                  <Progress value={((writeIndex + 1) / words.length) * 100} className="mt-2 h-1.5 overflow-hidden [&_[data-slot=progress-indicator]]:bg-[#d4a853] [&_[data-slot=progress-indicator]]:transition-transform [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out" />

                  {writeEntry && (
                    <Card className="mt-5 gap-0 overflow-hidden border-[#dfc994] bg-white py-0 text-left shadow-[0_18px_50px_rgba(91,67,23,0.10)] dark:border-[#66502b] dark:bg-gradient-to-br dark:from-[#211e18] dark:via-[#191713] dark:to-[#2a2115] dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                      <CardHeader className="border-b border-[#eee5d5] bg-gradient-to-br from-[#fffdf8] to-[#fff7e5] px-5 py-5 dark:border-[#594526] dark:from-black/10 dark:to-[#2a2115]/70">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Badge variant="outline" className="rounded-full border-[#dfc994] text-[#9a6b18] dark:text-[#d4b05a]">{lang === 'vi' ? 'Viết từ' : 'Write the word'}</Badge>
                          <Button variant="outline" size="sm" onClick={() => handleSpeak(writeEntry.word)} className="group h-9 rounded-xl border-[#d4a853] text-[#9a6b18] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 motion-reduce:transform-none dark:text-[#d4b05a]">
                            <Volume2 className={cn('size-4 transition-transform duration-200 group-hover:scale-110', speakingWord === writeEntry.word.trim().toLowerCase() && 'scale-125 text-[#d4a853]')} /> {v.pronounce}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5 px-5 py-5">
                        <div className="rounded-2xl border border-[#eee5d5] bg-[#faf8f3] p-4 dark:border-[#594526] dark:bg-black/15">
                          <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#9a6b18] dark:text-[#d4b05a]">{copy.definition}</p>
                            <p className="text-sm leading-6 text-[#374151] dark:text-[#d8d1c3]">{writePrompt || copy.listenAndWrite}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#9a6b18] dark:text-[#d4b05a]">{copy.wordType}</p>
                            <p className="text-sm font-semibold text-[#1a1a2e] dark:text-[#eee8dc]">{writePartOfSpeech}</p>
                          </div>
                          </div>
                        <div className="mt-4 border-t border-dashed border-[#dfc994] pt-4 dark:border-[#66502b]">
                          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#9a6b18] dark:text-[#d4b05a]">
                            <Sparkles className="size-3.5" /> {copy.hint}
                          </p>
                          <p className="text-sm text-[#4b5563] dark:text-[#b8b2a6]">{writeHintLetters}</p>
                          {writeDetail?.exampleSentence && (
                            <p className="mt-3 text-sm italic leading-6 text-[#6b7280] dark:text-[#aaa397]">
                              {copy.example}: “{writeDetail.exampleSentence}”
                            </p>
                          )}
                        </div>
                        </div>

                        <div
                          className={cn(
                            'flex flex-wrap justify-center gap-2 rounded-2xl bg-white/70 px-4 py-3 font-mono text-3xl font-black tracking-[0.22em] shadow-inner dark:bg-black/15',
                            writeResult === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-[#111827] dark:text-[#f5f0e8]',
                          )}
                        >
                          {writeMaskLetters.map((item, index) => (
                            <span
                              key={`${item.letter}-${index}`}
                              className={cn(
                                'inline-block min-w-4 text-center transition-all duration-200',
                                item.visible && !item.fixed && writeResult !== 'correct' && 'text-red-500 dark:text-red-400',
                                item.visible && writeResult === 'correct' && 'scale-110 text-green-600 dark:text-green-400',
                                item.fixed && 'text-[#7a7060] dark:text-[#9f998c]',
                              )}
                            >
                              {item.visible ? item.letter : '*'}
                            </span>
                          ))}
                        </div>

                        <Input
                          value={writeAnswer}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            setWriteAnswer(nextValue)
                            const isCorrect = nextValue.trim().toLocaleLowerCase() === normalizedWriteWord
                            setWriteResult(isCorrect ? 'correct' : null)
                            if (isCorrect && writeResult !== 'correct') playAnswerSound(true)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && writeResult === 'correct') nextWritingQuestion()
                          }}
                          placeholder={copy.typeHere}
                          autoComplete="off"
                          className={cn(
                            'h-12 rounded-xl border-2 bg-white text-base font-semibold transition-all duration-200 dark:bg-black/15',
                            writeResult === 'correct'
                              ? 'border-green-500 bg-green-50 text-green-700 shadow-[0_0_0_4px_rgba(34,197,94,0.10)] dark:bg-green-950/20'
                              : writeAnswer && !normalizedWriteWord.startsWith(normalizedWriteAnswer)
                                ? 'animate-in slide-in-from-left-1 duration-150 border-red-500 text-red-700 shadow-[0_0_0_4px_rgba(239,68,68,0.08)] focus-visible:border-red-500 motion-reduce:animate-none dark:bg-red-950/20'
                                : 'border-[#ded8cc] focus-visible:border-[#d4a853] dark:border-[#594526] dark:focus-visible:border-[#d4b05a]',
                          )}
                        />

                        {writeResult === 'correct' && (
                          <div className="animate-in zoom-in-95 fade-in duration-200 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-400">
                            {copy.correct}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="justify-center border-t border-[#eee5d5] bg-[#faf8f3] px-6 py-4 dark:border-[#594526] dark:bg-black/15">
                        {writeResult === 'correct' && (
                          <Button onClick={nextWritingQuestion} className="h-10 rounded-xl bg-[#d4a853] font-bold text-white transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:bg-[#bd913d] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none dark:text-[#171614]">
                            {copy.nextQuestion} <ArrowRight className="size-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
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
    setWordsLoading(false)
  }, [])

  useEffect(() => {
    const openSavedWords = () => {
      window.sessionStorage.removeItem('linguaflow-open-saved-vocabulary')
      setShowSavedWords(true)
    }

    if (window.sessionStorage.getItem('linguaflow-open-saved-vocabulary') === '1') {
      openSavedWords()
    }

    window.addEventListener('vocabulary:open-saved', openSavedWords)
    return () => window.removeEventListener('vocabulary:open-saved', openSavedWords)
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
      .getDeck(activeDeck.id)
      .then(async (detail) => {
        const word =
          detail.currentCard ??
          (await vocabularyApi.getDeck(activeDeck.id, undefined, 1)).currentCard
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
  const totalDecks = allDecks.length
  const learningDecks = allDecks.filter((deck) => deck.learnedWords > 0 && deck.completionPercentage < 100).length
  const completedDecks = allDecks.filter((deck) => deck.completionPercentage >= 100).length
  const studiedDecks = allDecks.filter((deck) => deck.learnedWords > 0).length
  const totalStudyDays = streak?.totalCheckIns ?? 0
  const masteredPercent = stats.totalWords > 0 ? Math.round((stats.mastered / stats.totalWords) * 100) : 0
  const activityByDate = new Map((stats.dailyActivity ?? []).map((item) => [item.date, item.count]))
  const dueReviewCount = stats.dueReviews ?? stats.notMastered
  const reviewMinutes = dueReviewCount === 0 ? 0 : Math.max(1, Math.ceil(dueReviewCount / 2))
  const checkedInDates = new Set(streak?.checkedInDates ?? [])
  const streakToday = new Date(`${streak?.today ?? toLocalDayKey(new Date())}T00:00:00`)
  const activityDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(streakToday)
    date.setDate(streakToday.getDate() - (41 - index))
    const key = toLocalDayKey(date)
    const count = activityByDate.get(key) ?? (checkedInDates.has(key) ? 1 : 0)
    const level = getActivityLevel(count)
    return {
      key,
      count,
      level,
      today: key === (streak?.today ?? toLocalDayKey(new Date())),
    }
  })

  const playFeaturedWord = () => {
    if (!featuredWord) return
    void playVocabularyPronunciation({
      word: featuredWord.word,
      accent: 'US',
      audioUrl: featuredWord.audioUsUrl ?? featuredWord.audioUkUrl,
    })
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
    void playVocabularyPronunciation({ word: word.word, accent: 'US', audioUrl: word.audioUsUrl ?? word.audioUkUrl })
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
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">
                  {v.pageTitle}
                </h1>
                <p className="mt-1 text-sm text-[#647084] dark:text-[#9f998c]">
                  {v.pageSubtitle}
                </p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSpacedInfo(true)}
                  className="h-11 gap-2 rounded-xl border-[#ded8cc] bg-[#faf8f3] px-5 font-semibold text-[#4b5563] shadow-sm hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#12110f] dark:text-[#b8b2a6] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
                >
                  <CircleHelp className="size-4" />
                  {v.spacedRepetitionBtn}
                </Button>
              </div>
            </section>

            <VocabularySectionNav lang={lang} />

            <section className="mb-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <Card className="gap-0 rounded-xl border-[#ded8cc] bg-white p-0 shadow-sm dark:border-[#34312d] dark:bg-[#171614]">
                <CardHeader className="border-b border-[#eee5d5] px-5 py-4 dark:border-[#2a2824]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.learningStats}</CardTitle>
                      <CardDescription className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{v.learningStatsSubtitle}</CardDescription>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]">
                      <BarChart3 className="size-5" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 px-5 py-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: v.totalCards, value: stats.totalWords, icon: CardsThree, tone: 'navy' },
                      { label: v.mastered, value: stats.mastered, icon: PhosphorTrophy, tone: 'green' },
                      { label: v.notMastered, value: stats.notMastered, icon: PhosphorTarget, tone: 'amber' },
                      { label: v.unlearned, value: unlearnedWords, icon: BookBookmark, tone: 'muted' },
                      { label: v.totalStudyDays, value: totalStudyDays, icon: CalendarCheck, tone: 'gold' },
                      { label: v.totalReviews, value: stats.totalReviews, icon: ArrowCounterClockwise, tone: 'neutral' },
                    ].map((item) => {
                      const Icon = item.icon
                      const toneClass =
                        item.tone === 'green'
                          ? 'bg-[#eaf5ef] text-[#3f8f65] dark:bg-[#17271f] dark:text-[#6db68b]'
                          : item.tone === 'amber'
                            ? 'bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]'
                            : item.tone === 'navy'
                              ? 'bg-[#eceef8] text-[#24284f] dark:bg-[#20233e] dark:text-[#c6cdfd]'
                              : item.tone === 'gold'
                                ? 'bg-[#fff8e8] text-[#9a6b18] dark:bg-[#241f14] dark:text-[#d4b05a]'
                                : 'bg-[#f1eee7] text-[#7a7060] dark:bg-[#25231f] dark:text-[#b8b2a6]'
                      return (
                        <div key={item.label} className="flex min-h-24 items-center gap-3 rounded-lg border border-[#eee5d5] bg-[#faf8f3] p-3 dark:border-[#34312d] dark:bg-[#12110f]">
                          <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
                            <Icon className="size-6" weight="duotone" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#7a7060] dark:text-[#9f998c]">{item.label}</p>
                            <p className="mt-1 text-[28px] font-bold leading-none text-[#1a1a2e] dark:text-[#e8e3d8]">{formatCount(Number(item.value), lang)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-lg border border-[#eee5d5] bg-[#faf8f3] p-4 dark:border-[#34312d] dark:bg-[#12110f]">
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.vocabStatus}</p>
                      <p className="mt-0.5 text-[13px] text-[#7a7060] dark:text-[#9f998c]">{masteredPercent}% {v.mastered}</p>
                    </div>
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#ede4d0] dark:bg-[#2a2824]">
                      <span className="bg-[#3f8f65]" style={{ width: `${stats.totalWords ? (stats.mastered / stats.totalWords) * 100 : 0}%` }} />
                      <span className="bg-[#b8832e]" style={{ width: `${stats.totalWords ? (stats.notMastered / stats.totalWords) * 100 : 0}%` }} />
                      <span className="bg-[#d4a853]" style={{ width: `${stats.totalWords ? (unlearnedWords / stats.totalWords) * 100 : 0}%` }} />
                    </div>
                    <div className="mt-3 grid gap-2 text-[13px] text-[#7a7060] sm:grid-cols-3 dark:text-[#9f998c]">
                      <span><span className="mr-1.5 inline-block size-2 rounded-sm bg-[#3f8f65]" />{stats.mastered} {v.mastered}</span>
                      <span><span className="mr-1.5 inline-block size-2 rounded-sm bg-[#b8832e]" />{stats.notMastered} {v.notMastered}</span>
                      <span><span className="mr-1.5 inline-block size-2 rounded-sm bg-[#d4a853]" />{unlearnedWords} {v.unlearned}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-xl border-[#ded8cc] bg-white p-0 shadow-sm dark:border-[#34312d] dark:bg-[#171614]">
                <CardHeader className="border-b border-[#eee5d5] px-5 py-4 dark:border-[#2a2824]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.studyProgress}</CardTitle>
                      <CardDescription className="mt-1 text-xs text-[#7a7060] dark:text-[#9f998c]">{v.studyProgressSubtitle}</CardDescription>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf5ef] text-[#3f8f65] dark:bg-[#17271f] dark:text-[#6db68b]">
                      <ClipboardCheck className="size-5" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 px-5 py-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: v.studiedDecks, value: `${studiedDecks}/${totalDecks}`, icon: BookMarked },
                      { label: v.learningDecks, value: learningDecks, icon: Brain },
                      { label: v.completedDecks, value: completedDecks, icon: Check },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="rounded-lg border border-[#eee5d5] bg-[#faf8f3] p-3 dark:border-[#34312d] dark:bg-[#12110f]">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-[#7a7060] dark:text-[#9f998c]">{item.label}</p>
                            <Icon className="size-4 text-[#d4a853]" />
                          </div>
                          <p className="mt-2 text-[28px] font-bold leading-none text-[#1a1a2e] dark:text-[#e8e3d8]">{item.value}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-lg border border-[#eee5d5] bg-[#faf8f3] p-4 dark:border-[#34312d] dark:bg-[#12110f]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[13px] font-semibold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.activityHeatmap}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#7a7060] dark:text-[#9f998c]">
                        <span>{v.lowActivity}</span>
                        <span className="size-3 rounded-[3px] bg-[#f4efe6] dark:bg-[#211f1c]" />
                        <span className="size-3 rounded-[3px] bg-[#e7c978]" />
                        <span className="size-3 rounded-[3px] bg-[#d4a853]" />
                        <span className="size-3 rounded-[3px] bg-[#3f8f65]" />
                        <span>{v.highActivity}</span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(21,minmax(0,1fr))]">
                      {activityDays.map((day) => (
                        <span
                          key={day.key}
                          tabIndex={0}
                          aria-label={`${formatActivityDate(day.key, lang)}: ${day.count} ${lang === 'vi' ? 'thẻ đã học' : 'studied cards'}`}
                          className={cn(
                            'group relative aspect-square rounded-[4px] border outline-none transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5',
                            day.level === 'high'
                              ? 'border-[#3f8f65] bg-[#3f8f65]'
                              : day.level === 'medium'
                                ? 'border-[#d4a853] bg-[#d4a853]'
                                : day.level === 'low'
                                  ? 'border-[#e7c978] bg-[#e7c978]'
                                  : 'border-[#e5dece] bg-[#f4efe6] dark:border-[#34312d] dark:bg-[#211f1c]',
                            day.today && 'ring-2 ring-[#24284f] ring-offset-2 ring-offset-white dark:ring-[#d4b05a] dark:ring-offset-[#171614]',
                          )}
                        >
                          <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-30 min-w-36 -translate-x-1/2 rounded-lg border border-[#d7a94b]/45 bg-[#171614] px-3 py-2 text-left opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <span className="block text-[11px] font-semibold text-[#f4d48a]">
                              {day.today ? (lang === 'vi' ? 'Hôm nay' : 'Today') : formatActivityDate(day.key, lang)}
                            </span>
                            <span className="mt-0.5 block whitespace-nowrap text-xs font-medium text-[#f5f0e8]">
                              {day.count} {lang === 'vi' ? 'thẻ đã học' : 'studied cards'}
                            </span>
                            <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#d7a94b]/45 bg-[#171614]" />
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-[#eee5d5] bg-[#faf8f3] p-4 text-center dark:border-[#34312d] dark:bg-[#12110f]">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7a7060] dark:text-[#9f998c]">
                        <Sparkles className="size-3.5 text-[#d4a853]" />
                        {v.todayWord}
                      </div>
                      {featuredWord ? (
                        <>
                          <button
                            type="button"
                            onClick={playFeaturedWord}
                            className="mt-4 inline-flex max-w-full items-center justify-center gap-2 text-center text-2xl font-bold text-[#1a1a2e] transition-colors hover:text-[#b8832e] dark:text-[#e8e3d8] dark:hover:text-[#d4b05a]"
                          >
                            <span className="truncate">{featuredWord.word}</span>
                            <Volume2 className="size-4 shrink-0" />
                          </button>
                          {featuredWord.exampleSentence && (
                            <p className="mt-3 max-w-sm text-sm italic leading-6 text-[#7a7060] dark:text-[#b8b2a6]">
                              &ldquo;{highlightWordInExample(featuredWord.exampleSentence, featuredWord.word)}&rdquo;
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-[#7a7060] dark:text-[#9f998c]">{v.noFeaturedWord}</p>
                      )}
                    </div>

                    <div className="flex min-h-36 flex-col justify-center rounded-lg border border-[#eee5d5] bg-[#faf8f3] p-4 dark:border-[#34312d] dark:bg-[#12110f]">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a7060] dark:text-[#9f998c]">{v.activeTopic}</h3>
                        {activeDeck && (
                          <span className="rounded-full border border-[#ead9ad] bg-[#fff8e8] px-2.5 py-1 text-[11px] font-bold text-[#9a6b18] dark:border-[#3a3325] dark:bg-[#211a10] dark:text-[#d4b05a]">
                            {activeDeck.completionPercentage}%
                          </span>
                        )}
                      </div>
                      {activeDeck ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeDeck.premium && !isPro) {
                              setShowProGate(true)
                              return
                            }
                            router.push(`/dashboard/vocabulary/${activeDeck.id}`)
                          }}
                          className="mt-4 w-full rounded-lg text-left transition-colors hover:text-[#b8832e] dark:hover:text-[#d4b05a]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-base font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{localizedDeckTitle(activeDeck, v)}</p>
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fff3d6] text-[#b8832e] dark:bg-[#2a2115] dark:text-[#d4b05a]">
                              <ArrowRight className="size-4" />
                            </span>
                          </div>
                          <Progress value={activeDeck.completionPercentage} className="mt-4 h-2 bg-[#e8dfcf] dark:bg-[#25231f] [&_[data-slot=progress-indicator]]:bg-[#d4a853]" />
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#7a7060] dark:text-[#9f998c]">
                            <span>{activeDeck.learnedWords}/{activeDeck.wordCount} {v.cards}</span>
                            <span>{progressLabel(activeDeck, v)}</span>
                          </div>
                        </button>
                      ) : (
                        <p className="mt-4 text-sm text-[#7a7060] dark:text-[#9f998c]">{v.noActiveTopic}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-lg border border-[#eee5d5] bg-[#fff8e8] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#3a3325] dark:bg-[#211a10]">
                    <div>
                      <h3 className="font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{v.reviewToday}</h3>
                      <p className="mt-0.5 text-xs text-[#7a7060] dark:text-[#9f998c]">
                        {dueReviewCount > 0
                          ? `${dueReviewCount} ${v.reviewNeeded} · ${v.aboutMinutes} ${reviewMinutes} ${v.minutes}`
                          : v.reviewCompleted}
                      </p>
                    </div>
                    <Button
                      disabled={dueReviewCount === 0}
                      onClick={() => router.push('/dashboard/vocabulary/review')}
                      className="h-10 min-w-32 gap-2 rounded-lg bg-[#d4a853] px-5 font-bold text-white shadow-none hover:bg-[#bd913d] disabled:opacity-50 dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#e1bd6d]"
                    >
                      {v.start}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
            <section className="hidden" aria-hidden="true">
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
                    className="group flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] hover:shadow-sm active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]/35 motion-reduce:transform-none motion-reduce:transition-none dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
                  >
                    <span>{categoryFilters.length === 0 ? v.topicLabel : `${v.topicLabel} (${categoryFilters.length})`}</span>
                    <ChevronDown className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#f5f3ef] dark:bg-[#1a1917]">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{v.selectTopic}</span>
                    {categoryFilters.length > 0 && (
                      <button onClick={() => setCategoryFilters([])} className="rounded px-1 text-xs transition-all duration-200 hover:bg-[#fff8e8] hover:underline active:scale-95 motion-reduce:transform-none" style={{ color: '#d4a853' }}>
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
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm transition-all duration-200 hover:translate-x-0.5 hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 motion-reduce:transform-none dark:hover:bg-[#1a1a1a] dark:focus:bg-[#1a1a1a] dark:data-[highlighted]:bg-[#1a1a1a]"
                    >
                      <div
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200"
                        style={categoryFilters.includes(item.name) ? { borderColor: '#3b4fd8', backgroundColor: '#3b4fd8' } : { borderColor: '#9ca3af' }}
                      >
                        {categoryFilters.includes(item.name) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="animate-in zoom-in-50 duration-150">
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
                    className="group flex h-10 items-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-5 text-sm font-medium text-gray-700 shadow-none transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] hover:shadow-sm active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a853]/35 motion-reduce:transform-none motion-reduce:transition-none dark:border-[#34312d] dark:bg-[#171614] dark:text-gray-300 dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115]"
                  >
                    <span>{progressFilters.length === 0 ? v.progressLabel : `${v.progressLabel} (${progressFilters.length})`}</span>
                    {progressFilters.length > 0 && (
                      <span className="flex items-center gap-1">
                        {progressFilters.slice(0, 3).map((filter) => {
                          const option = progressOptions.find((item) => item.value === filter)
                          return (
                            <span
                              key={filter}
                              className="h-2 w-2 animate-in zoom-in-50 rounded-full"
                              style={{ backgroundColor: option?.color }}
                            />
                          )
                        })}
                      </span>
                    )}
                    <ChevronDown className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl bg-[#f5f3ef] dark:bg-[#1a1917] border border-gray-200 dark:border-[#1a1a1a] p-0">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{v.selectProgress}</span>
                    {progressFilters.length > 0 && (
                      <button onClick={() => setProgressFilters([])} className="rounded px-1 text-xs transition-all duration-200 hover:bg-[#fff8e8] hover:underline active:scale-95 motion-reduce:transform-none" style={{ color: '#d4a853' }}>
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
                      className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-all duration-200 hover:translate-x-0.5 hover:bg-gray-50 focus:bg-gray-50 data-[highlighted]:bg-gray-50 motion-reduce:transform-none dark:hover:bg-[#1a1a1a] dark:focus:bg-[#1a1a1a] dark:data-[highlighted]:bg-[#1a1a1a]"
                    >
                      <div
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200"
                        style={progressFilters.includes(value) ? { borderColor: color, backgroundColor: color } : { borderColor: '#9ca3af' }}
                      >
                        {progressFilters.includes(value) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="animate-in zoom-in-50 duration-150">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full transition-transform duration-200 group-data-[highlighted]:scale-125" style={{ backgroundColor: color }} />
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
                  <Badge key={topic} className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none dark:bg-gray-200 dark:text-gray-900">
                    {localizedCategory(topic, v)}
                    <button onClick={() => setCategoryFilters((current) => current.filter((item) => item !== topic))} className="ml-1 rounded-full transition-transform duration-200 hover:scale-125 hover:opacity-80 active:scale-95 motion-reduce:transform-none">×</button>
                  </Badge>
                ))}
                {progressFilters.map((filter) => {
                  const option = progressOptions.find((item) => item.value === filter)
                  return (
                    <Badge
                      key={filter}
                      className="flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
                      style={{ backgroundColor: option?.color }}
                    >
                      {option?.label}
                      <button onClick={() => setProgressFilters((current) => current.filter((item) => item !== filter))} className="ml-1 rounded-full transition-transform duration-200 hover:scale-125 hover:opacity-80 active:scale-95 motion-reduce:transform-none">×</button>
                    </Badge>
                  )
                })}
                <button onClick={() => { setCategoryFilters([]); setProgressFilters([]) }} className="rounded px-1 text-xs text-gray-400 underline transition-all duration-200 hover:-translate-y-0.5 hover:text-gray-600 active:translate-y-0 active:scale-95 motion-reduce:transform-none dark:hover:text-gray-200">
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
