'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CircleX,
  Eye,
  Headphones,
  Keyboard,
  List,
  PartyPopper,
  RotateCcw,
  Settings,
  Volume2,
  X,
} from 'lucide-react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { useLang } from '@/lib/i18n/LangProvider'
import {
  vocabularyApi,
  type VocabularyDeckDetailResponse,
  type VocabularyQuizOption,
  type VocabularyRating,
  type VocabularyTopicProgress,
  type VocabularyWordCard,
} from '@/lib/api/vocabulary'
import { vocabularyBankApi } from '@/lib/api/vocabularyBank'
import { cn } from '@/lib/utils'

type SaveStatus = 'checking' | 'idle' | 'saving' | 'saved' | 'duplicate' | 'error'
type LearningMode = 'flashcard' | 'quiz' | 'reverse-quiz'

interface TopicCompletionSummary {
  topicId: number
  topicTitle: string
  totalCards: number
  notMasteredCards: number
  masteredCards: number
}

function getCompletionSummary(data: VocabularyDeckDetailResponse): TopicCompletionSummary | null {
  const topic = data.activeTopic
  if (!topic?.completed) return null

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    totalCards: topic.totalWords,
    notMasteredCards: Math.max(topic.totalWords - topic.masteredWords, 0),
    masteredCards: topic.masteredWords,
  }
}

function SettingsSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative h-6 w-10 shrink-0 rounded-full bg-[#d8d1c4] outline-none transition data-[state=checked]:bg-[#d4a853] focus-visible:ring-2 focus-visible:ring-[#d4a853]/40 dark:bg-[#494640] dark:data-[state=checked]:bg-[#d4b05a]"
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px] dark:bg-[#171614]" />
    </SwitchPrimitive.Root>
  )
}

const PART_OF_SPEECH_LABELS: Record<string, { vi: string; en: string }> = {
  noun: { vi: 'Danh từ', en: 'Noun' },
  verb: { vi: 'Động từ', en: 'Verb' },
  adjective: { vi: 'Tính từ', en: 'Adjective' },
  adverb: { vi: 'Trạng từ', en: 'Adverb' },
  pronoun: { vi: 'Đại từ', en: 'Pronoun' },
  preposition: { vi: 'Giới từ', en: 'Preposition' },
  conjunction: { vi: 'Liên từ', en: 'Conjunction' },
  interjection: { vi: 'Thán từ', en: 'Interjection' },
  phrase: { vi: 'Cụm từ', en: 'Phrase' },
  idiom: { vi: 'Thành ngữ', en: 'Idiom' },
}

function getPartOfSpeechLabel(partOfSpeech: string, lang: 'vi' | 'en') {
  const normalized = partOfSpeech.trim().toLowerCase()
  return PART_OF_SPEECH_LABELS[normalized]?.[lang] ?? partOfSpeech
}

function HighlightedExample({ sentence, word }: { sentence: string; word: string }) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = sentence.split(new RegExp(`(${escapedWord})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <strong key={`${part}-${index}`} className="font-extrabold text-[#b8832e] dark:text-[#d4b05a]">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}

function QuizCard({
  card,
  options,
  selectedOptionId,
  loading,
  reverse,
  lang,
  onSelect,
  onSpeak,
}: {
  card: VocabularyWordCard
  options: VocabularyQuizOption[]
  selectedOptionId: number | null
  loading: boolean
  reverse: boolean
  lang: 'vi' | 'en'
  onSelect: (optionId: number) => void
  onSpeak: (accent: 'US' | 'UK') => void
}) {
  const answered = selectedOptionId !== null
  const correct = selectedOptionId === card.id

  return (
    <div className="flex min-h-[470px] w-full flex-col items-center justify-center rounded-lg border border-[#d8d1c4] bg-white px-5 py-8 text-center shadow-[0_3px_0_#d8d1c4] sm:min-h-[520px] sm:px-10 dark:border-[#34312d] dark:bg-[#171614] dark:shadow-[0_3px_0_#292724]">
      <div className="w-full max-w-xl">
        <h2 className="text-3xl font-bold text-[#b8832e] dark:text-[#d4b05a]">
          {reverse ? card.word : card.vietnameseTranslation}
        </h2>
        {reverse ? (
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-[#6b7280] dark:text-[#aaa497]">
            <button type="button" onClick={() => onSpeak('US')} className="flex items-center gap-1.5 hover:text-[#d4a853]">
              {card.ipaUs} <Volume2 className="size-4" />
            </button>
            <button type="button" onClick={() => onSpeak('UK')} className="flex items-center gap-1.5 hover:text-[#d4a853]">
              {card.ipaUk} <Volume2 className="size-4" />
            </button>
          </div>
        ) : (
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6b7280] dark:text-[#aaa497]">
            {card.vietnameseDefinition}
          </p>
        )}
        <p className="mt-6 text-sm font-medium text-[#6b7280] dark:text-[#aaa497]">
          {lang === 'vi' ? 'Chọn đáp án đúng' : 'Choose the correct answer'}
        </p>

        <div className="mt-3 space-y-3">
          {loading ? (
            [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full rounded-xl" />)
          ) : (
            options.map((option, index) => {
              const isCorrectOption = option.id === card.id
              const isSelected = option.id === selectedOptionId
              return (
                <Button
                  key={option.id}
                  variant="outline"
                  disabled={answered}
                  onClick={() => onSelect(option.id)}
                  className={cn(
                    'h-14 w-full justify-start gap-3 rounded-xl border-[#ded8cc] bg-white px-4 text-base font-semibold text-[#374151] shadow-none hover:border-[#d4a853] hover:bg-[#fff8e8] disabled:opacity-100 dark:border-[#494640] dark:bg-[#12110f] dark:text-[#d8d4ca]',
                    answered && isCorrectOption &&
                      'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400',
                    answered && isSelected && !isCorrectOption &&
                      'border-red-500 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-950/30 dark:text-red-400',
                    answered && !isCorrectOption && !isSelected && 'text-[#9ca3af] dark:text-[#6b7280]',
                  )}
                >
                  <span className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border border-[#cbd3df] text-sm',
                    answered && isCorrectOption && 'rounded-none border-transparent text-emerald-600',
                    answered && isSelected && !isCorrectOption && 'rounded-none border-transparent text-red-500',
                  )}>
                    {answered && isCorrectOption ? (
                      <Check className="size-5 stroke-[3]" />
                    ) : answered && isSelected ? (
                      <X className="size-5 stroke-[3]" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  {reverse ? option.vietnameseTranslation : option.word}
                </Button>
              )
            })
          )}
        </div>

        {answered && (
          <div className="mt-4">
            <div className={cn(
              'flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold',
              correct
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
            )}>
              {correct ? <CheckCircle2 className="size-4" /> : <CircleX className="size-4" />}
              {correct
                ? (lang === 'vi' ? 'Chính xác' : 'Correct')
                : (lang === 'vi' ? 'Không chính xác' : 'Incorrect')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TopicItem({
  topic,
  active,
  onSelect,
}: {
  topic: VocabularyTopicProgress
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition',
        active
          ? 'border-[#d4a853] bg-[rgba(201,168,76,0.1)] text-[#b47f1d] shadow-sm dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]'
          : 'border-[#ded8cc] bg-white hover:border-[#d4a853] dark:border-[#2e2c29] dark:bg-[#171614]',
      )}
    >
      <div className="size-10 shrink-0 overflow-hidden rounded-full border border-white/50 bg-[#f5ead4]">
        {topic.thumbnailUrl ? (
          <img src={topic.thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <BookOpen className="m-2.5 size-4 text-[#b8832e]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{topic.title}</p>
        <p className={cn('mt-0.5 text-xs', active ? 'text-[#9a6b18] dark:text-[#c9a552]' : 'text-[#7a7060] dark:text-[#9f998c]')}>
          {topic.learnedWords}/{topic.totalWords} thẻ
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          'min-w-9 justify-center rounded-full text-[11px]',
          active
            ? 'border-[#d4a853]/60 bg-[#fff8e8] text-[#9a6b18] dark:border-[#d4b05a]/50 dark:bg-[#2a2115] dark:text-[#d4b05a]'
            : 'border-[#ded8cc] text-[#7a7060] dark:border-[#3a3834]',
        )}
      >
        {topic.completionPercentage}%
      </Badge>
    </button>
  )
}

function LearningSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[520px] w-full rounded-lg" />
      </div>
    </div>
  )
}

export default function VocabularyLearningPage() {
  const params = useParams<{ deckSlug: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const [data, setData] = useState<VocabularyDeckDetailResponse | null>(null)
  const [currentStudyData, setCurrentStudyData] = useState<VocabularyDeckDetailResponse | null>(null)
  const [viewingPrevious, setViewingPrevious] = useState(false)
  const [navigatingCard, setNavigatingCard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportDescription, setReportDescription] = useState('')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resettingTopic, setResettingTopic] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [preferredAccent, setPreferredAccent] = useState<'US' | 'UK'>('US')
  const [learningMode, setLearningMode] = useState<LearningMode>('flashcard')
  const [quizOptions, setQuizOptions] = useState<VocabularyQuizOption[]>([])
  const [selectedQuizOptionId, setSelectedQuizOptionId] = useState<number | null>(null)
  const [quizOptionsLoading, setQuizOptionsLoading] = useState(false)
  const [completionSummary, setCompletionSummary] = useState<TopicCompletionSummary | null>(null)

  const deckSlug = params.deckSlug
  const selectedTopicSlug = searchParams.get('topic') ?? undefined

  const loadDeck = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await vocabularyApi.getDeck(deckSlug, selectedTopicSlug)
      setData(response)
      setCurrentStudyData(response)
      setViewingPrevious(false)
      setFlipped(false)
      setCompletionSummary(getCompletionSummary(response))
    } catch {
      setError(lang === 'vi' ? 'Không thể tải nội dung bộ từ vựng.' : 'Unable to load the vocabulary deck.')
    } finally {
      setLoading(false)
    }
  }, [deckSlug, lang, selectedTopicSlug])

  useEffect(() => {
    loadDeck()
  }, [loadDeck])

  useEffect(() => {
    const word = data?.currentCard?.word
    if (!word) {
      setSaveStatus('idle')
      return
    }

    let cancelled = false
    setSaveStatus('checking')
    vocabularyBankApi.exists(word)
      .then((exists) => {
        if (!cancelled) setSaveStatus(exists ? 'duplicate' : 'idle')
      })
      .catch(() => {
        if (!cancelled) setSaveStatus('idle')
      })

    return () => {
      cancelled = true
    }
  }, [data?.currentCard?.id])

  useEffect(() => {
    if (
      (learningMode !== 'quiz' && learningMode !== 'reverse-quiz') ||
      !data?.activeTopic ||
      !data.currentCard ||
      completionSummary
    ) {
      setQuizOptions([])
      setSelectedQuizOptionId(null)
      return
    }

    let cancelled = false
    setQuizOptionsLoading(true)
    setSelectedQuizOptionId(null)
    vocabularyApi.getQuizOptions(data.activeTopic.id, data.currentCard.id)
      .then((options) => {
        if (cancelled) return
        const allOptions = [
          ...options,
          {
            id: data.currentCard!.id,
            word: data.currentCard!.word,
            vietnameseTranslation: data.currentCard!.vietnameseTranslation,
          },
        ]
        setQuizOptions(allOptions.sort(() => Math.random() - 0.5))
      })
      .catch(() => {
        if (!cancelled) {
          setQuizOptions([{
            id: data.currentCard!.id,
            word: data.currentCard!.word,
            vietnameseTranslation: data.currentCard!.vietnameseTranslation,
          }])
        }
      })
      .finally(() => {
        if (!cancelled) setQuizOptionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [completionSummary, data?.activeTopic?.id, data?.currentCard?.id, learningMode])

  const selectTopic = (topicSlug: string) => {
    setCompletionSummary(null)
    router.replace(`/dashboard/vocabulary/${deckSlug}?topic=${topicSlug}`)
  }

  const speak = (accent: 'US' | 'UK') => {
    if (!data?.currentCard) return
    const audioUrl = accent === 'US' ? data.currentCard.audioUsUrl : data.currentCard.audioUkUrl

    if (audioUrl) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      void new Audio(audioUrl).play().catch(() => {
        if (!('speechSynthesis' in window)) return
        const utterance = new SpeechSynthesisUtterance(data.currentCard?.word ?? '')
        utterance.lang = accent === 'US' ? 'en-US' : 'en-GB'
        window.speechSynthesis.speak(utterance)
      })
      return
    }

    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(data.currentCard.word)
    utterance.lang = accent === 'US' ? 'en-US' : 'en-GB'
    window.speechSynthesis.speak(utterance)
  }

  const flipCard = () => {
    if (!flipped && soundEnabled) {
      speak(preferredAccent)
    }
    setFlipped((value) => !value)
  }

  const review = async (rating: VocabularyRating) => {
    if (!data?.currentCard || reviewing || viewingPrevious) return
    const currentCardId = data.currentCard.id
    const currentCardNumber = data.currentCardNumber
    const isLastCard = currentCardNumber >= data.totalCards
    setReviewing(true)
    try {
      const response = await vocabularyApi.reviewWord(currentCardId, rating)

      if (isLastCard && data.activeTopic) {
        setData(response)
        setCurrentStudyData(response)
        setCompletionSummary(getCompletionSummary(response))
      } else {
        setData(response)
        setCurrentStudyData(response)
      }
      setFlipped(false)
    } catch {
      setError(lang === 'vi' ? 'Không thể lưu tiến độ. Vui lòng thử lại.' : 'Unable to save progress. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  const studyNextTopic = () => {
    if (!data?.activeTopic) return
    const currentTopicIndex = data.topics.findIndex((topic) => topic.id === data.activeTopic?.id)
    const nextTopic = data.topics[currentTopicIndex + 1]

    if (nextTopic) {
      selectTopic(nextTopic.slug)
      return
    }

    router.push('/dashboard/vocabulary')
  }

  const resetTopic = async () => {
    if (!data?.activeTopic || resettingTopic) return
    setResettingTopic(true)
    setError(null)
    try {
      const response = await vocabularyApi.resetTopicProgress(data.activeTopic.id)
      setData(response)
      setCurrentStudyData(response)
      setCompletionSummary(null)
      setViewingPrevious(false)
      setFlipped(false)
      setResetDialogOpen(false)
    } catch {
      setError(lang === 'vi' ? 'Không thể bắt đầu học lại nhóm này.' : 'Unable to restart this group.')
    } finally {
      setResettingTopic(false)
    }
  }

  const showPreviousCard = async () => {
    if (!data || data.currentCardNumber <= 1 || navigatingCard) return
    setNavigatingCard(true)
    try {
      const previousData = await vocabularyApi.getDeck(
        deckSlug,
        data.activeTopic?.slug ?? selectedTopicSlug,
        data.currentCardNumber - 1,
      )
      setData(previousData)
      setViewingPrevious(true)
      setFlipped(false)
      setError(null)
    } catch {
      setError(lang === 'vi' ? 'Không thể tải thẻ trước.' : 'Unable to load the previous card.')
    } finally {
      setNavigatingCard(false)
    }
  }

  const returnToCurrentCard = () => {
    if (!currentStudyData) return
    setData(currentStudyData)
    setViewingPrevious(false)
    setFlipped(false)
    setError(null)
  }

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInteractiveTarget = target?.matches(
        'input, textarea, select, button, a, [role="button"], [contenteditable="true"]',
      )
      if (isInteractiveTarget || event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === '?' && !reportOpen && !resetDialogOpen && !settingsOpen) {
        event.preventDefault()
        setShortcutsOpen(true)
        return
      }

      if (shortcutsOpen || settingsOpen || reportOpen || resetDialogOpen || completionSummary || !data?.currentCard) return

      if (learningMode === 'quiz' || learningMode === 'reverse-quiz') {
        const key = event.key.toLowerCase()

        if (selectedQuizOptionId !== null && key === 'a' && !reviewing) {
          event.preventDefault()
          void review('AGAIN')
        } else if (selectedQuizOptionId !== null && key === 'm' && !reviewing) {
          event.preventDefault()
          void review('MASTERED')
        } else if (
          selectedQuizOptionId !== null &&
          key === 's' &&
          !['checking', 'saving', 'saved', 'duplicate'].includes(saveStatus)
        ) {
          event.preventDefault()
          void saveCurrentWord()
        } else if (event.key === 'ArrowLeft' && data.currentCardNumber > 1 && !navigatingCard) {
          event.preventDefault()
          void showPreviousCard()
        }
        return
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        flipCard()
        return
      }

      if (event.key.toLowerCase() === 'a' && flipped && !viewingPrevious && !reviewing) {
        event.preventDefault()
        void review('AGAIN')
        return
      }

      if (event.key.toLowerCase() === 'm' && flipped && !viewingPrevious && !reviewing) {
        event.preventDefault()
        void review('MASTERED')
        return
      }

      if (event.key === 'ArrowLeft' && data.currentCardNumber > 1 && !navigatingCard) {
        event.preventDefault()
        void showPreviousCard()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [
    completionSummary,
    data,
    flipped,
    learningMode,
    navigatingCard,
    quizOptions,
    reportOpen,
    resetDialogOpen,
    reviewing,
    saveStatus,
    selectedQuizOptionId,
    settingsOpen,
    shortcutsOpen,
    viewingPrevious,
  ])

  const saveCurrentWord = async () => {
    if (!data?.currentCard || saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'duplicate') return
    setSaveStatus('saving')
    try {
      await vocabularyBankApi.save(data.currentCard.word)
      setSaveStatus('saved')
    } catch (error: any) {
      setSaveStatus(error?.response?.status === 409 ? 'duplicate' : 'error')
    }
  }

  const submitReport = () => {
    if (!reportDescription.trim()) return
    setReportOpen(false)
    setReportDescription('')
  }

  const flipHint = flipped
    ? lang === 'vi' ? 'Nhấn để quay lại mặt trước' : 'Tap to return to the front'
    : lang === 'vi' ? 'Nhấn để xem mặt sau' : 'Tap to reveal the back'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="gap-0 overflow-visible rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
          <DialogHeader className="px-6 pb-5 pt-7 text-center">
            <DialogTitle className="text-center text-xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
              {lang === 'vi' ? 'Cài đặt' : 'Settings'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 px-6 pb-7">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">
                {lang === 'vi' ? 'Ngôn ngữ dịch' : 'Translation language'}
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-between border-[#ded8cc] bg-white px-3 font-normal text-[#374151] hover:bg-[#faf8f3] dark:border-[#494640] dark:bg-[#12110f] dark:text-[#d8d4ca] dark:hover:bg-[#25231f]"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>🇻🇳</span>
                      {lang === 'vi' ? 'Tiếng Việt' : 'Vietnamese'}
                    </span>
                    <ChevronDown className="size-4 text-[#8a8578]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border border-[#ded8cc] bg-white p-1 dark:border-[#494640] dark:bg-[#171614]">
                  <DropdownMenuItem className="h-9 gap-2 bg-[#fff8e8] px-3 text-[#9a6b18] dark:bg-[#2a2115] dark:text-[#d4b05a]">
                    <span aria-hidden>🇻🇳</span>
                    {lang === 'vi' ? 'Tiếng Việt' : 'Vietnamese'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">
                  {lang === 'vi' ? 'Hiển thị Bản dịch' : 'Show translation'}
                </Label>
                <SettingsSwitch
                  checked={showTranslation}
                  onCheckedChange={setShowTranslation}
                  label={lang === 'vi' ? 'Hiển thị bản dịch' : 'Show translation'}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">
                  {lang === 'vi' ? 'Hiển thị Chú giải' : 'Show notes'}
                </Label>
                <SettingsSwitch
                  checked={showNotes}
                  onCheckedChange={setShowNotes}
                  label={lang === 'vi' ? 'Hiển thị chú giải' : 'Show notes'}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">
                  {lang === 'vi' ? 'Hiệu ứng âm thanh' : 'Sound effects'}
                </Label>
                <SettingsSwitch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  label={lang === 'vi' ? 'Hiệu ứng âm thanh' : 'Sound effects'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#374151] dark:text-[#d8d4ca]">
                {lang === 'vi' ? 'Giọng phát âm' : 'Pronunciation accent'}
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-between border-[#ded8cc] bg-white px-3 font-normal text-[#374151] hover:bg-[#faf8f3] dark:border-[#494640] dark:bg-[#12110f] dark:text-[#d8d4ca] dark:hover:bg-[#25231f]"
                  >
                    {preferredAccent === 'US'
                      ? (lang === 'vi' ? 'Tiếng Anh Mỹ (US)' : 'American English (US)')
                      : (lang === 'vi' ? 'Tiếng Anh Anh (UK)' : 'British English (UK)')}
                    <ChevronDown className="size-4 text-[#8a8578]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] border border-[#ded8cc] bg-white p-1 dark:border-[#494640] dark:bg-[#171614]">
                  {(['US', 'UK'] as const).map((accent) => (
                    <DropdownMenuItem
                      key={accent}
                      onSelect={() => setPreferredAccent(accent)}
                      className={cn(
                        'h-9 px-3',
                        preferredAccent === accent &&
                          'bg-[#d4a853] text-white focus:bg-[#bd9140] focus:text-white dark:bg-[#d4b05a] dark:text-[#171614]',
                      )}
                    >
                      {accent === 'US'
                        ? (lang === 'vi' ? 'Tiếng Anh Mỹ (US)' : 'American English (US)')
                        : (lang === 'vi' ? 'Tiếng Anh Anh (UK)' : 'British English (UK)')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
          <DialogHeader className="px-6 pb-4 pt-7 text-center">
            <DialogTitle className="text-center text-xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
              {lang === 'vi' ? 'Phím Tắt Bàn Phím' : 'Keyboard Shortcuts'}
            </DialogTitle>
            <DialogDescription className="pt-1 text-center text-sm text-[#6b7280] dark:text-[#aaa497]">
              {lang === 'vi'
                ? 'Sử dụng phím tắt bàn phím để học nhanh hơn'
                : 'Use keyboard shortcuts to study faster'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6 pb-7 pt-2 text-sm text-[#374151] dark:text-[#d8d4ca]">
            {(learningMode === 'quiz' || learningMode === 'reverse-quiz'
              ? [
                  { keys: ['A'], vi: 'Chưa thành thạo (sau khi trả lời)', en: 'Not mastered (after answering)' },
                  { keys: ['M'], vi: 'Thành thạo (sau khi trả lời)', en: 'Mastered (after answering)' },
                  { keys: ['S'], vi: 'Lưu từ', en: 'Save word' },
                  { keys: ['←'], vi: 'Xem từ trước', en: 'Previous word' },
                  { keys: ['?'], vi: 'Mở bảng phím tắt', en: 'Open shortcuts' },
                ]
              : [
                  { keys: ['Space', 'Enter'], vi: 'Lật thẻ', en: 'Flip card' },
                  { keys: ['A'], vi: 'Chưa thành thạo', en: 'Not mastered' },
                  { keys: ['M'], vi: 'Thành thạo', en: 'Mastered' },
                  { keys: ['←'], vi: 'Xem từ trước', en: 'Previous word' },
                  { keys: ['?'], vi: 'Mở bảng phím tắt', en: 'Open shortcuts' },
                ]
            ).map((shortcut) => (
              <div key={shortcut.keys.join('-')} className="flex items-center gap-3">
                <div className="flex min-w-28 items-center gap-1.5">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="inline-flex min-w-7 items-center justify-center rounded-md border border-[#ded8cc] bg-[#faf8f3] px-2 py-1 font-sans text-xs font-semibold text-[#374151] shadow-sm dark:border-[#494640] dark:bg-[#25231f] dark:text-[#d8d4ca]"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
                <span>{lang === 'vi' ? shortcut.vi : shortcut.en}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetDialogOpen} onOpenChange={(open) => !resettingTopic && setResetDialogOpen(open)}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
          <DialogHeader className="px-6 pb-4 pt-7 text-center">
            <DialogTitle className="text-center text-xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
              {lang === 'vi' ? 'Xác nhận học lại nhóm này' : 'Restart this group?'}
            </DialogTitle>
            <DialogDescription className="pt-2 text-center text-sm text-[#6b7280] dark:text-[#aaa497]">
              {lang === 'vi'
                ? 'Bạn có chắc chắn muốn học lại nhóm này từ đầu?'
                : 'Are you sure you want to restart this group from the beginning?'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="flex gap-3 rounded-xl border border-[#ead9b5] bg-[#fff8e8] px-4 py-3 text-left dark:border-[#594526] dark:bg-[#2a2115]">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#b8832e] dark:text-[#d4b05a]" />
              <p className="text-sm leading-5 text-[#7a5b24] dark:text-[#d5bd8a]">
                {lang === 'vi'
                  ? 'Cảnh báo: Tiến độ học tập của nhóm này sẽ bị xóa, bao gồm trạng thái thành thạo và chưa thành thạo của từng từ.'
                  : 'Warning: This group progress will be deleted, including the mastered and not mastered status of each word.'}
              </p>
            </div>
          </div>

          <DialogFooter className="m-0 grid grid-cols-2 gap-3 border-t border-[#edf0f4] bg-white px-6 py-4 dark:border-[#2e2c29] dark:bg-[#171614]">
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={resettingTopic}
                className="h-10 border-[#ded8cc] bg-white font-semibold text-[#374151] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#d8d4ca]"
              >
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={resettingTopic}
              onClick={() => void resetTopic()}
              className="h-10 bg-[#d4a853] font-semibold text-white hover:bg-[#bd9140] dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#c29f4f]"
            >
              <RotateCcw className={cn('size-4', resettingTopic && 'animate-spin')} />
              {resettingTopic
                ? (lang === 'vi' ? 'Đang reset...' : 'Resetting...')
                : (lang === 'vi' ? 'Xác nhận học lại' : 'Confirm restart')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open)
          if (!open) setReportDescription('')
        }}
      >
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]"
        >
          <DialogHeader className="px-6 pb-4 pt-7 text-center">
            <DialogTitle className="text-center text-xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">
              {lang === 'vi' ? 'Báo lỗi' : 'Report issue'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 pb-5">
            <div className="rounded-2xl border border-[#dce3ee] bg-[#f8faff] px-4 py-3 dark:border-[#34312d] dark:bg-[#12110f]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#69758a] dark:text-[#9f998c]">
                {lang === 'vi' ? 'Từ vựng' : 'Vocabulary'}
              </p>
              <p className="mt-1 text-base font-bold text-[#24284f] dark:text-[#e8e3d8]">
                {data?.currentCard?.word}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vocabulary-report" className="text-xs font-medium uppercase tracking-wide text-[#69758a] dark:text-[#9f998c]">
                {lang === 'vi' ? 'Có gì sai?' : 'What is wrong?'}
              </Label>
              <textarea
                id="vocabulary-report"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder={lang === 'vi' ? 'Mô tả lỗi...' : 'Describe the issue...'}
                autoFocus
                className="min-h-28 w-full resize-y rounded-lg border-2 border-[#cbd3df] bg-white px-3 py-3 text-sm text-[#1a1a2e] outline-none transition placeholder:text-[#8490a3] focus:border-[#24284f] focus:ring-2 focus:ring-[#24284f]/15 dark:border-[#494640] dark:bg-[#0f0e0c] dark:text-[#e8e3d8] dark:focus:border-[var(--accent-gold)] dark:focus:ring-[var(--accent-gold)]/15"
              />
            </div>
          </div>

          <DialogFooter className="m-0 flex-row justify-end gap-2 border-t border-[#edf0f4] bg-white px-5 py-2.5 dark:border-[#2e2c29] dark:bg-[#171614]">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="h-8 rounded-lg border-[0.25px] border-[#7a7670] bg-transparent px-4 text-xs font-medium text-[#7a7670] shadow-none hover:bg-gray-100 hover:text-[#7a7670] dark:hover:bg-gray-800"
              >
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={!reportDescription.trim()}
              onClick={submitReport}
              className="h-8 rounded-lg border-[0.25px] border-[#d4a853] bg-[rgba(212,168,83,0.15)] px-4 text-xs font-semibold text-[#d4a853] shadow-none hover:bg-[rgba(212,168,83,0.25)] disabled:border-[#d4a853] disabled:bg-[rgba(212,168,83,0.15)] disabled:text-[#d4a853] disabled:opacity-50"
            >
              {lang === 'vi' ? 'Gửi' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TopicsHeader />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <div className="min-w-0 flex-1 overflow-y-auto">
          {loading && <LearningSkeleton />}

          {!loading && error && !data && (
            <main className="flex min-h-full items-center justify-center p-6">
              <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 text-center dark:border-red-950 dark:bg-[#171614]">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" className="mt-4" onClick={loadDeck}>
                  {lang === 'vi' ? 'Thử lại' : 'Retry'}
                </Button>
              </div>
            </main>
          )}

          {!loading && data && (
            <main className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-5 sm:px-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Button
                    variant="outline"
                    className="mb-3 border-[#ded8cc] bg-white transition-colors hover:border-[var(--accent-gold)] hover:bg-[rgba(201,168,76,0.1)] hover:text-[var(--accent-gold)] focus-visible:border-[var(--accent-gold)] focus-visible:text-[var(--accent-gold)] dark:border-[#2e2c29] dark:bg-[#171614] dark:hover:border-[var(--accent-gold)] dark:hover:bg-[rgba(212,176,90,0.12)] dark:hover:text-[var(--accent-gold)]"
                    onClick={() => router.push('/dashboard/vocabulary')}
                  >
                    <ArrowLeft className="size-4" /> {lang === 'vi' ? 'Quay lại' : 'Back'}
                  </Button>
                  <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{data.deck.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-1 rounded-xl border border-[#ded8cc] bg-white p-1 shadow-sm md:flex dark:border-[#2e2c29] dark:bg-[#171614]">
                    <Button variant="ghost" size="sm" className="rounded-lg px-3 text-[#7a7060] hover:bg-[#f5f0e8] dark:hover:bg-[#25231f]">
                      <Brain className="size-4" /> {lang === 'vi' ? 'Đoán' : 'Guess'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setLearningMode('flashcard')
                        setSelectedQuizOptionId(null)
                      }}
                      className={cn(
                        'rounded-lg px-3 font-semibold shadow-sm',
                        learningMode === 'flashcard'
                          ? 'border border-[#d4a853] bg-[rgba(201,168,76,0.1)] text-[#b47f1d] hover:bg-[rgba(201,168,76,0.18)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]'
                          : 'bg-transparent text-[#7a7060] hover:bg-[#f5f0e8] dark:text-[#9f998c] dark:hover:bg-[#25231f]',
                      )}
                    >
                      <Eye className="size-4" />
                      <span>Flashcard</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setLearningMode('quiz')
                        setFlipped(false)
                      }}
                      className={cn(
                        'rounded-lg px-3 font-semibold shadow-sm',
                        learningMode === 'quiz'
                          ? 'border border-[#d4a853] bg-[rgba(201,168,76,0.1)] text-[#b47f1d] hover:bg-[rgba(201,168,76,0.18)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]'
                          : 'bg-transparent text-[#7a7060] hover:bg-[#f5f0e8] dark:text-[#9f998c] dark:hover:bg-[#25231f]',
                      )}
                    >
                      <CircleHelp className="size-4" /> {lang === 'vi' ? 'Trắc nghiệm' : 'Quiz'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setLearningMode('reverse-quiz')
                        setFlipped(false)
                      }}
                      className={cn(
                        'rounded-lg px-3 font-semibold shadow-sm',
                        learningMode === 'reverse-quiz'
                          ? 'border border-[#d4a853] bg-[rgba(201,168,76,0.1)] text-[#b47f1d] hover:bg-[rgba(201,168,76,0.18)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a]'
                          : 'bg-transparent text-[#7a7060] hover:bg-[#f5f0e8] dark:text-[#9f998c] dark:hover:bg-[#25231f]',
                      )}
                    >
                      <RotateCcw className="size-4" /> {lang === 'vi' ? 'Trắc nghiệm đảo' : 'Reverse quiz'}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-lg px-3 text-[#7a7060] hover:bg-[#f5f0e8] dark:hover:bg-[#25231f]">
                      <RotateCcw className="size-4" /> {lang === 'vi' ? 'Lặp lại' : 'Repeat'}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={lang === 'vi' ? 'Phím tắt' : 'Shortcuts'}
                    onClick={() => setShortcutsOpen(true)}
                    className="border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]"
                  >
                    <Keyboard className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={lang === 'vi' ? 'Cài đặt' : 'Settings'}
                    onClick={() => setSettingsOpen(true)}
                    className="border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]"
                  >
                    <Settings className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-4 lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 w-full justify-between border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]">
                      <span>{data.activeTopic?.title ?? (lang === 'vi' ? 'Chọn chủ đề' : 'Choose topic')}</span>
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-2rem)]">
                    {data.topics.map((topic) => (
                      <DropdownMenuItem key={topic.id} onClick={() => selectTopic(topic.slug)}>
                        <span className="flex-1">{topic.title}</span>
                        <span className="text-xs text-[#7a7060]">{topic.learnedWords}/{topic.totalWords}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="hidden min-h-0 rounded-lg border border-[#ded8cc] bg-[#faf8f3] p-3 lg:block dark:border-[#2e2c29] dark:bg-[#12110f]">
                  <h2 className="px-1 pb-3 text-sm font-bold uppercase tracking-wide text-[#374151] dark:text-[#c4bfb0]">
                    {lang === 'vi' ? 'Danh sách chủ đề' : 'Topic list'}
                  </h2>
                  <div className="max-h-[650px] space-y-2 overflow-y-auto pr-1">
                    {data.topics.map((topic) => (
                      <TopicItem
                        key={topic.id}
                        topic={topic}
                        active={topic.id === data.activeTopic?.id}
                        onSelect={() => selectTopic(topic.slug)}
                      />
                    ))}
                  </div>
                </aside>

                <section className="min-w-0">
                  <div className="mb-3 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold uppercase tracking-wide text-[#4b5563] dark:text-[#b8b2a6]">
                        {lang === 'vi' ? 'Tiến độ' : 'Progress'} - {data.activeTopic?.title}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#4b5563] dark:text-[#b8b2a6]">
                      {completionSummary ? completionSummary.totalCards : data.currentCardNumber} / {data.totalCards}{' '}
                      {lang === 'vi' ? 'thẻ' : 'cards'}
                    </p>
                  </div>
                  <Progress
                    value={completionSummary ? 100 : (data.activeTopic?.completionPercentage ?? 0)}
                    className="mb-4 h-2 bg-[#ded8cc] dark:bg-[#2e2c29] [&_[data-slot=progress-indicator]]:bg-[#d4a853]"
                  />

                  {error && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-950 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {completionSummary ? (
                    <div className="flex min-h-[470px] w-full flex-col items-center justify-center rounded-lg border border-[#d8d1c4] bg-white px-5 py-10 text-center shadow-[0_3px_0_#d8d1c4] sm:min-h-[520px] sm:px-10 dark:border-[#34312d] dark:bg-[#171614] dark:shadow-[0_3px_0_#292724]">
                      <div className="flex size-20 items-center justify-center rounded-full border border-[#ead9b5] bg-[#fff8e8] text-[#b8832e] shadow-sm dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#d4b05a]">
                        <PartyPopper className="size-10" />
                      </div>

                      <h2 className="mt-5 text-2xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
                        {lang === 'vi' ? 'Tuyệt vời!' : 'Great job!'}
                      </h2>
                      <p className="mt-2 text-sm text-[#6b7280] dark:text-[#aaa497]">
                        {lang === 'vi'
                          ? `Bạn đã học xong các từ trong nhóm ${completionSummary.topicTitle}.`
                          : `You have finished the words in ${completionSummary.topicTitle}.`}
                      </p>
                      <p className="mt-1 text-sm italic text-[#8a8578] dark:text-[#8f897d]">
                        {lang === 'vi'
                          ? 'Hãy ôn tập thường xuyên để ghi nhớ lâu dài nhé!'
                          : 'Review regularly to remember them for longer.'}
                      </p>

                      <p className="mt-5 text-lg font-bold text-[#374151] dark:text-[#d8d4ca]">
                        {lang === 'vi' ? 'Đã học' : 'Studied'} {completionSummary.totalCards} / {completionSummary.totalCards}{' '}
                        {lang === 'vi' ? 'từ' : 'words'}
                      </p>

                      <div className="mt-4 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#ded8cc] bg-[#faf8f3] px-4 py-3 dark:border-[#34312d] dark:bg-[#12110f]">
                          <p className="text-xl font-bold text-[#7a7060] dark:text-[#b8b2a6]">{completionSummary.notMasteredCards}</p>
                          <p className="mt-1 text-xs font-medium text-[#7a7060] dark:text-[#9f998c]">
                            {lang === 'vi' ? 'Chưa thành thạo' : 'Not mastered'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[#d4a853] bg-[rgba(201,168,76,0.1)] px-4 py-3 dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)]">
                          <p className="text-xl font-bold text-[#9a6b18] dark:text-[#d4b05a]">{completionSummary.masteredCards}</p>
                          <p className="mt-1 text-xs font-medium text-[#9a6b18] dark:text-[#c9a552]">
                            {lang === 'vi' ? 'Thành thạo' : 'Mastered'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          className="h-11 border-[#ded8cc] bg-white font-semibold text-[#374151] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#d8d4ca] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
                          onClick={() => router.push('/dashboard/vocabulary')}
                        >
                          <List className="size-4" />
                          {lang === 'vi' ? 'Xem từ vựng' : 'View vocabulary'}
                        </Button>
                        <Button
                          className="h-11 bg-[#d4a853] font-semibold text-white hover:bg-[#bd9140] dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#c29f4f]"
                          onClick={studyNextTopic}
                        >
                          <BookOpen className="size-4" />
                          {data.topics.findIndex((topic) => topic.id === completionSummary.topicId) < data.topics.length - 1
                            ? (lang === 'vi' ? 'Học nhóm tiếp theo' : 'Study next group')
                            : (lang === 'vi' ? 'Hoàn tất bộ từ' : 'Finish deck')}
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        className="mt-3 h-10 font-semibold text-[#7a7060] hover:bg-[#f1eee7] hover:text-[#9a6b18] dark:text-[#b8b2a6] dark:hover:bg-[#25231f] dark:hover:text-[#d4b05a]"
                        onClick={() => setResetDialogOpen(true)}
                      >
                        <RotateCcw className="size-4" />
                        {lang === 'vi' ? 'Học lại từ đầu' : 'Study again'}
                      </Button>
                    </div>
                  ) : (learningMode === 'quiz' || learningMode === 'reverse-quiz') && data.currentCard ? (
                    <>
                      <QuizCard
                        card={data.currentCard}
                        options={quizOptions}
                        selectedOptionId={selectedQuizOptionId}
                        loading={quizOptionsLoading}
                        reverse={learningMode === 'reverse-quiz'}
                        lang={lang}
                        onSelect={setSelectedQuizOptionId}
                        onSpeak={speak}
                      />

                      {selectedQuizOptionId !== null && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[#7a7060] dark:text-[#9f998c]">
                            <span>
                              {lang === 'vi' ? 'Nhóm học' : 'Group'}{' '}
                              {Math.max(data.topics.findIndex((topic) => topic.id === data.activeTopic?.id) + 1, 1)}/{data.topics.length}
                            </span>
                            <span>
                              {lang === 'vi' ? 'Tổng cộng' : 'Total'}{' '}
                              {data.topics.reduce((total, topic) => total + topic.totalWords, 0)}{' '}
                              {lang === 'vi' ? 'thẻ' : 'cards'}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              disabled={reviewing}
                              onClick={() => void review('AGAIN')}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#7a7060] transition hover:bg-[#f1eee7] disabled:opacity-50 dark:text-[#b8b2a6] dark:hover:bg-[#25231f]"
                            >
                              <CircleX className="size-4" />
                              {lang === 'vi' ? 'Chưa thành thạo' : 'Not mastered'}
                            </button>
                            <button
                              type="button"
                              disabled={reviewing}
                              onClick={() => void review('MASTERED')}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#9a6b18] transition hover:bg-[#fff8e8] disabled:opacity-50 dark:text-[#d4b05a] dark:hover:bg-[#2a2115]"
                            >
                              <CheckCircle2 className="size-4" />
                              {lang === 'vi' ? 'Thành thạo' : 'Mastered'}
                            </button>
                            <button
                              type="button"
                              disabled={saveStatus === 'checking' || saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'duplicate'}
                              onClick={saveCurrentWord}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-70',
                                saveStatus === 'error'
                                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                                  : saveStatus === 'saved'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-[#24284f] hover:bg-[#f5f3ef] dark:text-[#d8d4ca] dark:hover:bg-[#25231f]',
                              )}
                            >
                              <Bookmark className="size-4" />
                              {saveStatus === 'saving'
                                ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...')
                                : saveStatus === 'saved'
                                  ? (lang === 'vi' ? 'Đã lưu' : 'Saved')
                                  : saveStatus === 'duplicate'
                                    ? (lang === 'vi' ? 'Đã có trong kho' : 'Already saved')
                                    : saveStatus === 'error'
                                      ? (lang === 'vi' ? 'Thử lưu lại' : 'Retry save')
                                      : (lang === 'vi' ? 'Lưu' : 'Save')}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : data.currentCard ? (
                    <>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={flipCard}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            flipCard()
                          }
                        }}
                        className="group relative min-h-[470px] w-full rounded-lg border border-[#d8d1c4] bg-white text-left shadow-[0_3px_0_#d8d1c4] transition hover:border-[#d4a853] sm:min-h-[520px] dark:border-[#34312d] dark:bg-[#171614] dark:shadow-[0_3px_0_#292724]"
                        aria-label={flipped ? (lang === 'vi' ? 'Ẩn nghĩa của từ' : 'Hide the meaning') : (lang === 'vi' ? 'Lật thẻ để xem nghĩa' : 'Flip the card to see the meaning')}
                        style={{ perspective: '1600px' }}
                      >
                        <button
                          type="button"
                          aria-label={lang === 'vi' ? 'Báo lỗi từ vựng' : 'Report vocabulary issue'}
                          title={lang === 'vi' ? 'Báo lỗi' : 'Report issue'}
                          onClick={(event) => {
                            event.stopPropagation()
                            setReportOpen(true)
                          }}
                          className="absolute left-5 top-5 z-10 flex size-8 items-center justify-center rounded-lg text-[#7a8495] transition hover:bg-[#fff8e8] hover:text-[var(--accent-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]/40 dark:text-[#9f998c] dark:hover:bg-[#2a2115] dark:hover:text-[var(--accent-gold)]"
                        >
                          <AlertTriangle className="size-4" />
                        </button>
                        {data.currentCardNumber > 1 && (
                          <button
                            type="button"
                            disabled={navigatingCard}
                            onClick={(event) => {
                              event.stopPropagation()
                              void showPreviousCard()
                            }}
                            className="absolute left-14 top-5 z-10 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#7a7060] transition hover:bg-[#fff8e8] hover:text-[#9a6b18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]/40 disabled:opacity-50 dark:text-[#9f998c] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
                            aria-label={lang === 'vi' ? 'Quay lại từ trước' : 'Previous word'}
                            title={lang === 'vi' ? 'Quay lại từ trước' : 'Previous word'}
                          >
                            <ArrowLeft className="size-4" />
                            {lang === 'vi' ? 'Từ trước' : 'Previous'}
                          </button>
                        )}
                        {viewingPrevious && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              returnToCurrentCard()
                            }}
                            className="absolute left-40 top-5 z-10 flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold text-[#9a6b18] transition hover:bg-[#fff8e8] dark:text-[#d4b05a] dark:hover:bg-[#2a2115]"
                          >
                            {lang === 'vi' ? 'Thẻ hiện tại' : 'Current card'}
                          </button>
                        )}
                        <div className="absolute right-5 top-5 z-10 rounded-full border border-[#ead9b5] bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold text-[#9a6420] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62]">
                          {flipped ? (lang === 'vi' ? 'Mặt sau' : 'Back') : (lang === 'vi' ? 'Mặt trước' : 'Front')}
                        </div>

                        <div
                          className="relative min-h-[470px] transition-transform duration-500 [transform-style:preserve-3d] sm:min-h-[520px]"
                          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        >
                          <div className="absolute inset-0 flex flex-col px-6 py-8 sm:px-8 [backface-visibility:hidden]">
                            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
                              {data.currentCard.imageUrl && (
                                <img
                                  src={data.currentCard.imageUrl}
                                  alt={data.currentCard.word}
                                  className="mb-4 h-32 w-44 rounded-lg border border-[#ded8cc] object-cover dark:border-[#34312d]"
                                />
                              )}
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <h2 className="text-4xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
                                  {data.currentCard.word}
                                </h2>
                                <Badge
                                  variant="outline"
                                  className="h-auto rounded-full border-[#d4a853]/60 bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#9a6b18] shadow-sm dark:border-[#d4b05a]/50 dark:bg-[#2a2115] dark:text-[#d4b05a]"
                                >
                                  {getPartOfSpeechLabel(data.currentCard.partOfSpeech, lang)}
                                </Badge>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-[#4b5563] dark:text-[#aaa497]">
                                <button
                                  type="button"
                                  onClick={(event) => { event.stopPropagation(); speak('US') }}
                                  className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-[#fff8e8] hover:text-[#d4a853] dark:hover:bg-[#2a2115]"
                                >
                                  US: {data.currentCard.ipaUs} <Volume2 className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => { event.stopPropagation(); speak('UK') }}
                                  className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-[#fff8e8] hover:text-[#d4a853] dark:hover:bg-[#2a2115]"
                                >
                                  UK: {data.currentCard.ipaUk} <Volume2 className="size-4" />
                                </button>
                              </div>

                              <div className="mt-8 flex items-center gap-2 rounded-full border border-[#ead9b5] bg-[#fff8e8] px-4 py-2 text-sm font-medium text-[#9a6420] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62]">
                                <RotateCcw className={cn('size-4 transition-transform duration-500', flipped && 'rotate-180')} />
                                <span>{flipHint}</span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="absolute inset-0 flex flex-col px-6 py-8 [backface-visibility:hidden] sm:px-8"
                            style={{ transform: 'rotateY(180deg)' }}
                          >
                            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
                              <div className="mb-4 text-center">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b1aaa0]">
                                  {data.currentCard.word}
                                </p>
                                <h3 className={cn(
                                  'mt-2 text-2xl font-bold text-[#b8832e] dark:text-[#d4b05a]',
                                  !showTranslation && 'hidden',
                                )}>
                                  {data.currentCard.vietnameseTranslation}
                                </h3>
                              </div>

                              <div className={cn(
                                'rounded-2xl border border-[#efe5d2] bg-[#fffdf8] p-5 shadow-sm dark:border-[#34312d] dark:bg-[#12110f]',
                                !showNotes && 'hidden',
                              )}>
                                <div className="space-y-4 text-sm leading-6 text-[#374151] dark:text-[#c4bfb0]">
                                  <div>
                                    <p className="mb-1 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
                                      {lang === 'vi' ? 'Định nghĩa' : 'Definition'}
                                    </p>
                                    <p><strong>EN:</strong> {data.currentCard.englishDefinition}</p>
                                    {showTranslation && <p><strong>VI:</strong> {data.currentCard.vietnameseDefinition}</p>}
                                  </div>
                                  {data.currentCard.exampleSentence && (
                                    <div>
                                      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
                                        {lang === 'vi' ? 'Ví dụ' : 'Example'} <Headphones className="size-3.5" />
                                      </p>
                                      <p className="italic">
                                        <HighlightedExample
                                          sentence={data.currentCard.exampleSentence}
                                          word={data.currentCard.word}
                                        />
                                      </p>
                                      {showTranslation && (
                                        <p className="text-[#6b7280] dark:text-[#9f998c]">{data.currentCard.exampleSentenceVi}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-5 flex items-center justify-center gap-4 text-sm text-[#4b5563] dark:text-[#aaa497]">
                                <button
                                  type="button"
                                  onClick={(event) => { event.stopPropagation(); speak('US') }}
                                  className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-[#fff8e8] hover:text-[#d4a853] dark:hover:bg-[#2a2115]"
                                >
                                  US: {data.currentCard.ipaUs} <Volume2 className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => { event.stopPropagation(); speak('UK') }}
                                  className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-[#fff8e8] hover:text-[#d4a853] dark:hover:bg-[#2a2115]"
                                >
                                  UK: {data.currentCard.ipaUk} <Volume2 className="size-4" />
                                </button>
                              </div>

                              <div className="mt-5 flex justify-center">
                                <div className="flex items-center gap-2 rounded-full border border-[#ead9b5] bg-[#fff8e8] px-4 py-2 text-sm font-medium text-[#9a6420] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62]">
                                  <RotateCcw className={cn('size-4 transition-transform duration-500', flipped && 'rotate-180')} />
                                  <span>{flipHint}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {flipped && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[#7a7060] dark:text-[#9f998c]">
                            <span>
                              {lang === 'vi' ? 'Nhóm học' : 'Group'}{' '}
                              {Math.max(data.topics.findIndex((topic) => topic.id === data.activeTopic?.id) + 1, 1)}/{data.topics.length}
                            </span>
                            <span>
                              {lang === 'vi' ? 'Tổng cộng' : 'Total'}{' '}
                              {data.topics.reduce((total, topic) => total + topic.totalWords, 0)}{' '}
                              {lang === 'vi' ? 'thẻ' : 'cards'}
                            </span>
                          </div>

                          {viewingPrevious ? (
                            <div className="mt-4 flex justify-center">
                              <span className="rounded-full border border-[#ead9b5] bg-[#fff8e8] px-4 py-2 text-xs font-semibold text-[#9a6b18] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#d4b05a]">
                                {lang === 'vi'
                                  ? 'Đang xem lại - trạng thái học không thay đổi'
                                  : 'Reviewing only - learning status is unchanged'}
                              </span>
                            </div>
                          ) : (
                          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              disabled={reviewing}
                              onClick={() => review('AGAIN')}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#7a7060] transition hover:bg-[#f1eee7] disabled:opacity-50 dark:text-[#b8b2a6] dark:hover:bg-[#25231f]"
                            >
                              <CircleX className="size-4" />
                              {lang === 'vi' ? 'Chưa thành thạo' : 'Not mastered'}
                            </button>
                            <button
                              type="button"
                              disabled={reviewing}
                              onClick={() => review('MASTERED')}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#9a6b18] transition hover:bg-[#fff8e8] disabled:opacity-50 dark:text-[#d4b05a] dark:hover:bg-[#2a2115]"
                            >
                              <CheckCircle2 className="size-4" />
                              {lang === 'vi' ? 'Thành thạo' : 'Mastered'}
                            </button>
                            <button
                              type="button"
                              disabled={saveStatus === 'checking' || saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'duplicate'}
                              onClick={saveCurrentWord}
                              className={cn(
                                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-70',
                                saveStatus === 'error'
                                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                                  : saveStatus === 'saved'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-[#24284f] hover:bg-[#f5f3ef] dark:text-[#d8d4ca] dark:hover:bg-[#25231f]',
                              )}
                            >
                              <Bookmark className="size-4" />
                              {saveStatus === 'saving'
                                ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...')
                                : saveStatus === 'saved'
                                  ? (lang === 'vi' ? 'Đã lưu' : 'Saved')
                                  : saveStatus === 'duplicate'
                                    ? (lang === 'vi' ? 'Đã có trong kho' : 'Already saved')
                                    : saveStatus === 'error'
                                      ? (lang === 'vi' ? 'Thử lưu lại' : 'Retry save')
                                      : (lang === 'vi' ? 'Lưu' : 'Save')}
                            </button>
                          </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex min-h-[470px] flex-col items-center justify-center rounded-lg border border-[#ded8cc] bg-white p-8 text-center dark:border-[#2e2c29] dark:bg-[#171614]">
                      <BookOpen className="size-10 text-[#d4a853]" />
                      <h2 className="mt-4 text-lg font-semibold">
                        {lang === 'vi' ? 'Chủ đề này chưa có thẻ từ vựng' : 'This topic has no vocabulary cards yet'}
                      </h2>
                      <p className="mt-1 text-sm text-[#7a7060]">
                        {lang === 'vi' ? 'Dữ liệu có thể được bổ sung sau từ CMS.' : 'Content can be added later from the CMS.'}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  )
}
