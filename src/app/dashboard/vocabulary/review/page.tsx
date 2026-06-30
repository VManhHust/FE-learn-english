'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Headphones,
  List,
  RotateCcw,
  Volume2,
} from 'lucide-react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { VocabularySectionNav } from '@/components/vocabulary/VocabularySectionNav'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLang } from '@/lib/i18n/LangProvider'
import {
  vocabularyApi,
  type VocabularyQuizOption,
  type VocabularyRating,
  type VocabularyReviewTopic,
  type VocabularyWordCard,
} from '@/lib/api/vocabulary'
import { GuessCard, QuizCard } from '@/app/dashboard/vocabulary/[deckId]/page'
import { playAnswerSound } from '@/lib/vocabularyAnswerSound'
import { playVocabularyPronunciation } from '@/lib/vocabularyPronunciation'
import {
  VocabularyBackButton,
  VocabularyModeToolbar,
  type VocabularyLearningMode,
} from '@/components/vocabulary/VocabularyLearningToolbar'
import {
  VocabularySettingsDialog,
  VocabularyShortcutsDialog,
} from '@/components/vocabulary/VocabularyLearningDialogs'
import {
  VocabularyReportButton,
  VocabularyReportDialog,
} from '@/components/vocabulary/VocabularyReportDialog'
import { vocabularyBankApi } from '@/lib/api/vocabularyBank'
import { cn } from '@/lib/utils'

type GuessResult = 'correct' | 'incorrect' | null
type SaveStatus = 'checking' | 'idle' | 'saving' | 'saved' | 'duplicate' | 'error'

const REVIEW_WORDS_PAGE_SIZE = 4

const POS_LABELS: Record<string, { vi: string; en: string }> = {
  noun: { vi: 'Danh từ', en: 'Noun' },
  verb: { vi: 'Động từ', en: 'Verb' },
  adjective: { vi: 'Tính từ', en: 'Adjective' },
  adverb: { vi: 'Trạng từ', en: 'Adverb' },
  phrase: { vi: 'Cụm từ', en: 'Phrase' },
}

function HighlightedReviewExample({ sentence, word }: { sentence: string; word: string }) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return sentence.split(new RegExp(`(${escapedWord})`, 'gi')).map((part, partIndex) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <strong key={`${part}-${partIndex}`} className="font-extrabold text-[#b8832e] dark:text-[#d4b05a]">
        {part}
      </strong>
    ) : part,
  )
}

export default function VocabularyReviewPage() {
  const router = useRouter()
  const { lang } = useLang()
  const contentLanguage = lang
  const [cards, setCards] = useState<VocabularyWordCard[]>([])
  const [reviewTopics, setReviewTopics] = useState<VocabularyReviewTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [viewIndex, setViewIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<VocabularyLearningMode>('flashcard')
  const [flipped, setFlipped] = useState(false)
  const [quizOptions, setQuizOptions] = useState<VocabularyQuizOption[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [guessInput, setGuessInput] = useState('')
  const [guessResult, setGuessResult] = useState<GuessResult>(null)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [hintIndexes, setHintIndexes] = useState<number[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [accent, setAccent] = useState<'US' | 'UK'>('US')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [restartDialogOpen, setRestartDialogOpen] = useState(false)
  const [shuffleOnRestart, setShuffleOnRestart] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportDescription, setReportDescription] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [reviewWordsDialogOpen, setReviewWordsDialogOpen] = useState(false)
  const [reviewWordsPage, setReviewWordsPage] = useState(1)

  const card = cards[viewIndex] ?? null
  const selectedTopic = reviewTopics.find((topic) => topic.id === selectedTopicId) ?? null
  const viewingPrevious = viewIndex !== index
  const total = cards.length
  const completed = Math.min(index, total)
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const finished = !loading && total > 0 && index >= total
  const reviewedWordsTotalPages = Math.max(1, Math.ceil(cards.length / REVIEW_WORDS_PAGE_SIZE))
  const reviewedWordsCurrentPage = Math.min(reviewWordsPage, reviewedWordsTotalPages)
  const reviewedWordsStartIndex = (reviewedWordsCurrentPage - 1) * REVIEW_WORDS_PAGE_SIZE
  const paginatedReviewedWords = useMemo(
    () => cards.slice(reviewedWordsStartIndex, reviewedWordsStartIndex + REVIEW_WORDS_PAGE_SIZE),
    [cards, reviewedWordsStartIndex],
  )
  const reviewMasteredCount = cards.filter((reviewCard) => reviewCard.learningStatus === 'MASTERED').length
  const reviewNotMasteredCount = Math.max(cards.length - reviewMasteredCount, 0)
  const selectedTopicIndex = reviewTopics.findIndex((topic) => topic.id === selectedTopicId)
  const nextReviewTopic = selectedTopicIndex >= 0
    ? reviewTopics.slice(selectedTopicIndex + 1).find((topic) => topic.reviewWordCount > 0) ?? null
    : null

  const resetCard = useCallback(() => {
    setFlipped(false)
    setSelectedOptionId(null)
    setGuessInput('')
    setGuessResult(null)
    setAnswerRevealed(false)
    setHintIndexes([])
  }, [])

  const loadReview = useCallback(async (requestedTopicId?: number) => {
    setLoading(true)
    setError(null)
    try {
      const topics = await vocabularyApi.getReviewTopics()
      setReviewTopics(topics)
      const topicId = requestedTopicId && topics.some((topic) => topic.id === requestedTopicId)
        ? requestedTopicId
        : topics[0]?.id ?? null
      setSelectedTopicId(topicId)
      setCards(topicId ? await vocabularyApi.getReviewWords(topicId) : [])
      setIndex(0)
      setViewIndex(0)
      resetCard()
    } catch {
      setError(lang === 'vi' ? 'Không thể tải danh sách từ cần ôn.' : 'Unable to load review words.')
    } finally {
      setLoading(false)
    }
  }, [lang, resetCard])

  useEffect(() => {
    void loadReview()
  }, [loadReview])

  const selectReviewTopic = (topicId: number) => {
    if (topicId === selectedTopicId || loading) return
    void loadReview(topicId)
  }

  const shuffleRemainingReviewWords = () => {
    if (loading || finished || cards.length - index <= 1) return
    setCards((currentCards) => {
      const completedCards = currentCards.slice(0, index)
      const remainingCards = [...currentCards.slice(index)]
      for (let current = remainingCards.length - 1; current > 0; current -= 1) {
        const random = Math.floor(Math.random() * (current + 1))
        ;[remainingCards[current], remainingCards[random]] = [remainingCards[random], remainingCards[current]]
      }
      return [...completedCards, ...remainingCards]
    })
    setViewIndex(index)
    resetCard()
  }

  const restartReviewSession = (shuffle = false) => {
    if (!cards.length) return
    if (shuffle) {
      setCards((currentCards) => {
        const shuffledCards = [...currentCards]
        for (let current = shuffledCards.length - 1; current > 0; current -= 1) {
          const random = Math.floor(Math.random() * (current + 1))
          ;[shuffledCards[current], shuffledCards[random]] = [shuffledCards[random], shuffledCards[current]]
        }
        return shuffledCards
      })
    }
    setIndex(0)
    setViewIndex(0)
    resetCard()
    setRestartDialogOpen(false)
    setShuffleOnRestart(false)
  }

  const studyNextReviewTopic = () => {
    if (!nextReviewTopic) return
    selectReviewTopic(nextReviewTopic.id)
  }

  useEffect(() => {
    resetCard()
  }, [card?.id, contentLanguage, mode, resetCard])

  useEffect(() => {
    if (!card?.word) {
      setSaveStatus('idle')
      return
    }

    let cancelled = false
    setSaveStatus('checking')
    vocabularyBankApi.exists(card.word)
      .then((exists) => {
        if (!cancelled) setSaveStatus(exists ? 'duplicate' : 'idle')
      })
      .catch(() => {
        if (!cancelled) setSaveStatus('idle')
      })

    return () => {
      cancelled = true
    }
  }, [card?.id, card?.word])

  useEffect(() => {
    if (!card || (mode !== 'quiz' && mode !== 'reverse-quiz')) {
      setQuizOptions([])
      return
    }
    let cancelled = false
    setQuizLoading(true)
    vocabularyApi.getReviewQuizOptions(card.id, selectedTopicId ?? undefined)
      .then((options) => {
        if (cancelled) return
        setQuizOptions([
          ...options,
          {
            id: card.id,
            word: card.word,
            vietnameseTranslation: card.vietnameseTranslation,
            englishDefinition: card.englishDefinition,
          },
        ].sort(() => Math.random() - 0.5))
      })
      .catch(() => {
        if (!cancelled) {
          setQuizOptions([{
            id: card.id,
            word: card.word,
            vietnameseTranslation: card.vietnameseTranslation,
            englishDefinition: card.englishDefinition,
          }])
        }
      })
      .finally(() => {
        if (!cancelled) setQuizLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [card, contentLanguage, mode, selectedTopicId])

  const speak = useCallback((selectedAccent: 'US' | 'UK') => {
    if (!card) return
    const audioUrl = selectedAccent === 'US' ? card.audioUsUrl : card.audioUkUrl
    void playVocabularyPronunciation({
      word: card.word,
      accent: selectedAccent,
      audioUrl,
    })
  }, [card])

  const rate = useCallback(async (rating: VocabularyRating) => {
    if (!card || saving || viewingPrevious) return
    setSaving(true)
    setError(null)
    try {
      await vocabularyApi.reviewWord(card.id, rating)
      setCards((currentCards) => currentCards.map((currentCard) => (
        currentCard.id === card.id ? { ...currentCard, learningStatus: rating } : currentCard
      )))
      const nextIndex = index + 1
      setIndex(nextIndex)
      setViewIndex(nextIndex)
    } catch {
      setError(lang === 'vi' ? 'Không thể lưu kết quả ôn tập.' : 'Unable to save review result.')
    } finally {
      setSaving(false)
    }
  }, [card, index, lang, saving, viewingPrevious])

  const readyToRate = !viewingPrevious && (mode === 'flashcard'
    ? flipped
    : mode === 'guess'
      ? guessResult !== null || answerRevealed
      : selectedOptionId !== null)

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]')) return
      if (reportOpen || settingsOpen || shortcutsOpen || restartDialogOpen) return
      if (event.key === '?') {
        event.preventDefault()
        setShortcutsOpen(true)
        return
      }
      if (event.key.toLowerCase() === 'z' && readyToRate) {
        event.preventDefault()
        void rate('NOT_MASTERED')
      } else if (event.key.toLowerCase() === 'x' && readyToRate) {
        event.preventDefault()
        void rate('MASTERED')
      } else if (
        event.key.toLowerCase() === 'c' &&
        readyToRate &&
        !['checking', 'saving', 'saved', 'duplicate'].includes(saveStatus)
      ) {
        event.preventDefault()
        void saveCurrentWord()
      } else if (event.key === 'ArrowLeft' && viewIndex > 0) {
        event.preventDefault()
        setViewIndex((current) => Math.max(current - 1, 0))
      } else if (mode === 'flashcard' && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault()
        setFlipped((value) => !value)
      }
    }
    window.addEventListener('keydown', handleShortcut, true)
    return () => window.removeEventListener('keydown', handleShortcut, true)
  }, [mode, rate, readyToRate, reportOpen, restartDialogOpen, saveStatus, settingsOpen, shortcutsOpen, viewIndex])

  const revealHint = () => {
    if (!card || guessResult || saving) return
    const letters = Array.from(card.word)
    const limit = Math.floor(letters.filter((letter) => /[a-z]/i.test(letter)).length / 2) + 1
    if (hintIndexes.length >= limit) {
      speak(accent)
      return
    }
    const available = letters
      .map((letter, letterIndex) => /[a-z]/i.test(letter) && !hintIndexes.includes(letterIndex) ? letterIndex : -1)
      .filter((letterIndex) => letterIndex >= 0)
    if (available.length > 0) {
      setHintIndexes((current) => [...current, available[0]])
    }
  }

  const checkGuess = () => {
    if (!card || !guessInput.trim() || guessResult) return
    const correct = guessInput.trim().toLowerCase() === card.word.trim().toLowerCase()
    setGuessResult(correct ? 'correct' : 'incorrect')
    if (soundEnabled) playAnswerSound(correct)
  }

  const showGuessAnswer = () => {
    if (!card || guessResult || answerRevealed || saving) return
    setAnswerRevealed(true)
  }

  const selectQuizOption = (optionId: number) => {
    if (!card || selectedOptionId !== null) return
    setSelectedOptionId(optionId)
    if (soundEnabled) playAnswerSound(optionId === card.id)
  }

  const submitReport = () => {
    if (!reportDescription.trim()) return
    setReportOpen(false)
    setReportDescription('')
  }

  const saveCurrentWord = async () => {
    if (!card || ['saving', 'saved', 'duplicate'].includes(saveStatus)) return
    setSaveStatus('saving')
    try {
      await vocabularyBankApi.save(card.word)
      setSaveStatus('saved')
    } catch (saveError: any) {
      setSaveStatus(saveError?.response?.status === 409 ? 'duplicate' : 'error')
    }
  }

  const posLabel = card
    ? POS_LABELS[card.partOfSpeech.trim().toLowerCase()]?.[lang] ?? card.partOfSpeech
    : ''

  const flashcard = card && (
    <div
      onClick={() => {
        setFlipped((value) => !value)
        if (!flipped && soundEnabled) speak(accent)
      }}
      className="relative min-h-[440px] w-full cursor-pointer overflow-hidden rounded-xl border border-[#d8d1c4] bg-white text-left shadow-none sm:min-h-[520px] dark:border-[#34312d] dark:bg-[#171614] dark:shadow-[0_5px_0_#292724]"
      style={{ perspective: '1600px' }}
    >
      <div className="absolute right-5 top-5 z-10 rounded-full border border-[#ead9b5] bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold text-[#9a6420] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62]">
        {flipped ? (lang === 'vi' ? 'Mặt sau' : 'Back') : (lang === 'vi' ? 'Mặt trước' : 'Front')}
      </div>
      <div className="relative min-h-[440px] transition-transform duration-500 sm:min-h-[520px] [transform-style:preserve-3d]" style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div className="absolute inset-0 flex items-center justify-center px-4 py-16 text-center sm:px-8 sm:py-8 [backface-visibility:hidden]">
          <div>
            {card.imageUrl && <img src={card.imageUrl} alt={card.word} className="mx-auto mb-5 h-36 w-44 rounded-xl border border-[#ded8cc] object-cover" />}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-4xl font-bold text-[#24284f] dark:text-[#e8e3d8]">{card.word}</h2>
              <Badge variant="outline">{posLabel}</Badge>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-sm text-[#6b7280]">
              <button type="button" onClick={(event) => { event.stopPropagation(); speak('US') }} className="flex items-center gap-1.5 hover:text-[#d4a853]">
                US: {card.ipaUs} <Volume2 className="size-4" />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); speak('UK') }} className="flex items-center gap-1.5 hover:text-[#d4a853]">
                UK: {card.ipaUk} <Volume2 className="size-4" />
              </button>
            </div>
            <p className="mt-8 text-sm font-medium text-[#9a6b18]">{lang === 'vi' ? 'Nhấn để xem nghĩa' : 'Tap to reveal'}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col overflow-y-auto px-6 py-8 [backface-visibility:hidden] sm:px-8" style={{ transform: 'rotateY(180deg)' }}>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
            <div className="mb-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b1aaa0]">{card.word}</p>
              {showTranslation && (
                <h2 className="mt-2 text-2xl font-bold text-[#b8832e] dark:text-[#d4b05a]">
                  {contentLanguage === 'vi' ? card.vietnameseTranslation : card.englishDefinition}
                </h2>
              )}
            </div>

            {showNotes && (
              <div className="rounded-2xl border border-[#efe5d2] bg-[#fffdf8] p-5 shadow-sm dark:border-[#34312d] dark:bg-[#12110f]">
                <div className="space-y-4 text-sm leading-6 text-[#374151] dark:text-[#c4bfb0]">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
                      {lang === 'vi' ? 'Định nghĩa' : 'Definition'}
                    </p>
                    {card.englishDefinition && (
                      <p>{card.englishDefinition}</p>
                    )}
                    {contentLanguage === 'vi' && card.vietnameseDefinition && (
                      <p>{card.vietnameseDefinition}</p>
                    )}
                  </div>
                  {card.exampleSentence && (
                    <div>
                      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
                        {lang === 'vi' ? 'Ví dụ' : 'Example'} <Headphones className="size-3.5" />
                      </p>
                      <div className="space-y-1">
                        <p className="italic">
                          <HighlightedReviewExample sentence={card.exampleSentence} word={card.word} />
                        </p>
                        {contentLanguage === 'vi' && card.exampleSentenceVi && (
                          <p className="italic text-[#6f665a] dark:text-[#aaa497]">
                            {card.exampleSentenceVi}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-4 text-sm text-[#4b5563] dark:text-[#aaa497]">
              <button type="button" onClick={(event) => { event.stopPropagation(); speak('US') }} className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-[#fff8e8] hover:text-[#d4a853] dark:hover:bg-[#2a2115]">
                US: {card.ipaUs} <Volume2 className="size-4" />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); speak('UK') }} className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-[#fff8e8] hover:text-[#d4a853] dark:hover:bg-[#2a2115]">
                UK: {card.ipaUk} <Volume2 className="size-4" />
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-[#ead9b5] bg-[#fff8e8] px-4 py-2 text-sm font-medium text-[#9a6420] dark:border-[#594526] dark:bg-[#2a2115] dark:text-[#f2bd62]">
                <RotateCcw className="size-4 rotate-180" />
                <span>{lang === 'vi' ? 'Nhấn để quay lại mặt trước' : 'Tap to return to the front'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <TopicsHeader />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-3 py-4 sm:px-6 sm:py-5">
            <div className="mb-4">
              <VocabularyBackButton lang={lang} onClick={() => router.push('/dashboard/vocabulary')} />
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-[#e8e3d8]">{lang === 'vi' ? 'Ôn tập theo chủ đề' : 'Review by topic'}</h1>
                <VocabularyModeToolbar
                  lang={lang}
                  mode={mode}
                  onModeChange={setMode}
                  onShuffle={shuffleRemainingReviewWords}
                  onShortcuts={() => setShortcutsOpen(true)}
                  onSettings={() => setSettingsOpen(true)}
                />
              </div>
            </div>

            <VocabularySectionNav lang={lang} />

            <div className="mb-4 lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 w-full justify-between border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]">
                    <span className="truncate">
                      {selectedTopic?.title ?? (lang === 'vi' ? 'Chọn chủ đề ôn tập' : 'Choose a review topic')}
                    </span>
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-2rem)]">
                  {reviewTopics.map((topic) => (
                    <DropdownMenuItem key={topic.id} onClick={() => selectReviewTopic(topic.id)}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{topic.title}</span>
                        <span className="block truncate text-xs text-[#8a8578]">{topic.deckTitle}</span>
                      </span>
                      <span className="text-xs font-semibold text-[#9a6b18]">{topic.reviewWordCount}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="hidden min-h-0 rounded-lg border border-[#ded8cc] bg-[#faf8f3] p-3 lg:block dark:border-[#2e2c29] dark:bg-[#12110f]">
                <h2 className="px-1 pb-3 text-sm font-bold uppercase tracking-wide text-[#374151] dark:text-[#c4bfb0]">
                  {lang === 'vi' ? 'Chủ đề cần ôn' : 'Review topics'}
                </h2>
                <div className="max-h-[650px] space-y-2 overflow-y-auto pr-1">
                  {reviewTopics.map((topic) => {
                    const active = topic.id === selectedTopicId
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => selectReviewTopic(topic.id)}
                        className={cn(
                          'w-full rounded-lg border px-3 py-3 text-left transition',
                          active
                            ? 'border-[#d4a853] bg-[#fff8e8] shadow-sm dark:border-[#d4b05a] dark:bg-[#2a2115]'
                            : 'border-transparent bg-white hover:border-[#ded8cc] hover:bg-[#f5f0e8] dark:bg-[#171614] dark:hover:border-[#34312d] dark:hover:bg-[#25231f]',
                        )}
                      >
                        <span className={cn(
                          'block truncate text-sm font-semibold',
                          active ? 'text-[#9a6b18] dark:text-[#d4b05a]' : 'text-[#374151] dark:text-[#d8d4ca]',
                        )}>
                          {topic.title}
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2 text-xs text-[#7a7060] dark:text-[#9f998c]">
                          <span className="truncate">{topic.deckTitle}</span>
                          <span className="shrink-0 font-semibold">{topic.reviewWordCount} {lang === 'vi' ? 'thẻ' : 'cards'}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <section className="min-w-0">
            <div className="mb-5">
              <div className="mb-2 flex justify-between text-sm font-semibold text-[#4b5563] dark:text-[#b8b2a6]">
                <span className="truncate">
                  {lang === 'vi' ? 'TIẾN ĐỘ ÔN TẬP' : 'REVIEW PROGRESS'}{selectedTopic ? ` - ${selectedTopic.title}` : ''}
                </span>
                <span>{completed} / {total} {lang === 'vi' ? 'THẺ' : 'CARDS'}</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-[#dedbd3] [&_[data-slot=progress-indicator]]:bg-[#d4a853]" />
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {loading ? <Skeleton className="h-[520px] rounded-xl" /> : finished ? (
              <ReviewMessage
                title={nextReviewTopic
                  ? (lang === 'vi' ? 'Đã hoàn thành, ôn chủ đề tiếp theo nhé!' : 'Completed — review the next topic!')
                  : (lang === 'vi' ? 'Đã hoàn thành phiên ôn tập!' : 'Review completed!')}
                description={lang === 'vi'
                  ? `Bạn đã ôn xong tất cả thẻ trong chủ đề ${selectedTopic?.title ?? ''}.`
                  : `You have reviewed every card in ${selectedTopic?.title ?? 'this topic'}.`}
                lang={lang}
                completed
                onBack={() => router.push('/dashboard/vocabulary')}
                onViewVocabulary={() => setReviewWordsDialogOpen(true)}
                onStudyNext={studyNextReviewTopic}
                onStudyAgain={() => setRestartDialogOpen(true)}
                hasNextTopic={Boolean(nextReviewTopic)}
                finalTopic={!nextReviewTopic}
              />
            ) : !card ? (
              <ReviewMessage
                title={lang === 'vi' ? 'Không có từ cần ôn' : 'No words need review'}
                description={lang === 'vi'
                  ? 'Chủ đề này hiện không còn thẻ nào cần ôn tập.'
                  : 'This topic currently has no cards that need review.'}
                lang={lang}
                onBack={() => router.push('/dashboard/vocabulary')}
              />
            ) : (
              <>
                <div className="relative [&>div]:shadow-none dark:[&>div]:shadow-[0_5px_0_#292724]">
                  {mode !== 'guess' && <VocabularyReportButton lang={lang} onClick={() => setReportOpen(true)} />}
                  {viewIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewIndex((current) => Math.max(current - 1, 0))}
                      className="absolute left-14 top-5 z-20 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#7a7060] transition hover:bg-[#fff8e8] hover:text-[#9a6b18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]/40 dark:text-[#9f998c] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
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
                      onClick={() => setViewIndex(index)}
                      className="absolute left-40 top-5 z-20 flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold text-[#9a6b18] transition hover:bg-[#fff8e8] dark:text-[#d4b05a] dark:hover:bg-[#2a2115]"
                    >
                      {lang === 'vi' ? 'Thẻ hiện tại' : 'Current card'}
                    </button>
                  )}
                  {mode === 'guess' && (
                    <GuessCard
                      card={card}
                      value={guessInput}
                      result={guessResult}
                      answerRevealed={answerRevealed}
                      revealedHintIndexes={hintIndexes}
                      lang={lang}
                      onChange={setGuessInput}
                      onHint={revealHint}
                      onPlay={() => speak(accent)}
                      onUnknown={showGuessAnswer}
                      onCheck={checkGuess}
                      onReset={() => { setAnswerRevealed(false); setGuessInput(''); setGuessResult(null); setHintIndexes([]) }}
                      onSpeak={speak}
                      onReport={() => setReportOpen(true)}
                      showTranslation={showTranslation}
                      showNotes={showNotes}
                      contentLanguage={contentLanguage}
                    />
                  )}
                  {mode === 'flashcard' && flashcard}
                  {(mode === 'quiz' || mode === 'reverse-quiz') && (
                    <QuizCard
                      card={card}
                      options={quizOptions}
                      selectedOptionId={selectedOptionId}
                      loading={quizLoading}
                      reverse={mode === 'reverse-quiz'}
                      contentLanguage={contentLanguage}
                      lang={lang}
                      onSelect={selectQuizOption}
                      onSpeak={speak}
                    />
                  )}
                </div>
                {readyToRate && (
                  <div className="mt-5 flex flex-wrap justify-center gap-5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void rate('NOT_MASTERED')}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#7a7060] transition hover:bg-[#f1eee7] disabled:opacity-50 dark:text-[#b8b2a6] dark:hover:bg-[#25231f]"
                    >
                      <CircleX className="size-4" />
                      {lang === 'vi' ? 'Chưa thành thạo' : 'Not mastered'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void rate('MASTERED')}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#9a6b18] transition hover:bg-[#fff8e8] disabled:opacity-50 dark:text-[#d4b05a] dark:hover:bg-[#2a2115]"
                    >
                      <CheckCircle2 className="size-4" />
                      {lang === 'vi' ? 'Thành thạo' : 'Mastered'}
                    </button>
                    <Button
                      variant="ghost"
                      disabled={['checking', 'saving', 'saved', 'duplicate'].includes(saveStatus)}
                      onClick={() => void saveCurrentWord()}
                      className={cn(
                        'font-semibold disabled:opacity-70',
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
                    </Button>
                  </div>
                )}
              </>
            )}
              </section>
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={reviewWordsDialogOpen}
        onOpenChange={(open) => {
          setReviewWordsDialogOpen(open)
          if (!open) setReviewWordsPage(1)
        }}
      >
        <DialogContent className="max-h-[88vh] w-[calc(100%-1rem)] gap-0 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-5xl dark:border-[#d7a94b]/55 dark:bg-[#11100e] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(212,168,83,0.16),transparent_28%),radial-gradient(circle_at_95%_88%,rgba(74,222,128,0.10),transparent_32%),linear-gradient(135deg,#11100e_0%,#171410_52%,#211a10_100%)] [&_[data-slot=dialog-close]]:right-1 [&_[data-slot=dialog-close]]:top-4">
          <DialogHeader className="border-b border-[#efe7d8] bg-[#fffaf0] px-7 py-5 text-left sm:px-8 dark:border-[#d7a94b]/20 dark:bg-transparent">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_284px] sm:items-start">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#24284f] dark:text-[#f2eadc]">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#d4a853]/15 text-[#b8832e] dark:bg-[#d4b05a]/15 dark:text-[#f2c85f]">
                    <List className="size-4" />
                  </span>
                  {lang === 'vi' ? 'Từ vựng đã ôn' : 'Reviewed vocabulary'}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-[#6b7280] dark:text-[#aaa497]">
                  {lang === 'vi'
                    ? `Các từ trong chủ đề ${selectedTopic?.title ?? ''}.`
                    : `Words from ${selectedTopic?.title ?? 'this topic'}.`}
                </DialogDescription>
              </div>

              <div className="grid grid-cols-2 gap-2 pr-4 text-center">
                <div className="rounded-xl border border-[#ded8cc] bg-white px-3 py-2 dark:border-white/10 dark:bg-black/20">
                  <p className="text-lg font-bold text-[#7a7060] dark:text-[#d8d0bd]">
                    {reviewNotMasteredCount}
                  </p>
                  <p className="text-[11px] font-semibold text-[#7a7060] dark:text-[#b8ad9b]">
                    {lang === 'vi' ? 'Chưa thành thạo' : 'Not mastered'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d4a853] bg-[#d4a853]/10 px-3 py-2 dark:bg-[#d4b05a]/15">
                  <p className="text-lg font-bold text-[#9a6b18] dark:text-[#f2c85f]">
                    {reviewMasteredCount}
                  </p>
                  <p className="text-[11px] font-semibold text-[#9a6b18] dark:text-[#e0b954]">
                    {lang === 'vi' ? 'Thành thạo' : 'Mastered'}
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[58vh] overflow-y-auto bg-white px-7 py-4 sm:px-8 dark:bg-transparent">
            {cards.length === 0 ? (
              <div className="rounded-2xl border border-[#efe7d8] bg-[#faf8f3] px-4 py-8 text-center text-sm text-[#7a7060] dark:border-[#2e2c29] dark:bg-[#12110f] dark:text-[#aaa497]">
                {lang === 'vi' ? 'Chưa có từ vựng để hiển thị.' : 'There are no words to show.'}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedReviewedWords.map((word, wordIndex) => {
                  const mastered = word.learningStatus === 'MASTERED'
                  return (
                    <div
                      key={word.id}
                      className="rounded-2xl border border-[#efe7d8] bg-[#fffdf8] p-4 shadow-sm transition hover:border-[#d4a853]/70 hover:bg-[#fff8e8] dark:border-[#2e2c29] dark:bg-[#12110f] dark:hover:border-[#d4b05a]/45 dark:hover:bg-[#1c1811]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#d4a853]/12 text-xs font-bold text-[#9a6b18] dark:bg-[#d4b05a]/15 dark:text-[#f2c85f]">
                              {reviewedWordsStartIndex + wordIndex + 1}
                            </span>
                            <h3 className="text-lg font-extrabold text-[#24284f] dark:text-[#f2eadc]">
                              {word.word}
                            </h3>
                            <Badge variant="outline" className="rounded-full border-[#ded8cc] text-xs text-[#6b7280] dark:border-[#494640] dark:text-[#aaa497]">
                              {POS_LABELS[word.partOfSpeech.trim().toLowerCase()]?.[lang] ?? word.partOfSpeech}
                            </Badge>
                            <Badge
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-none',
                                mastered
                                  ? 'bg-[#d4a853]/15 text-[#9a6b18] hover:bg-[#d4a853]/15 dark:bg-[#d4b05a]/15 dark:text-[#f2c85f]'
                                  : 'bg-[#f1eee7] text-[#7a7060] hover:bg-[#f1eee7] dark:bg-white/10 dark:text-[#d8d0bd]',
                              )}
                            >
                              {mastered
                                ? (lang === 'vi' ? 'Thành thạo' : 'Mastered')
                                : (lang === 'vi' ? 'Chưa thành thạo' : 'Not mastered')}
                            </Badge>
                          </div>
                          <p className="mt-1 text-base font-semibold text-[#b8832e] dark:text-[#d4b05a]">
                            {contentLanguage === 'vi' ? word.vietnameseTranslation : word.englishDefinition}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2 text-xs text-[#7a7060] dark:text-[#aaa497]">
                          {word.ipaUs && <span>US: {word.ipaUs}</span>}
                          {word.ipaUk && <span>UK: {word.ipaUk}</span>}
                        </div>
                      </div>

                      <div className="mt-3 text-sm leading-6 text-[#4b5563] dark:text-[#c4bfb0]">
                        <div className="rounded-xl border border-[#efe7d8] bg-white/70 px-3 py-2 dark:border-[#2e2c29] dark:bg-black/15">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8578] dark:text-[#8f897d]">
                            {lang === 'vi' ? 'Định nghĩa' : 'Definition'}
                          </p>
                          <p>{word.englishDefinition}</p>
                          {contentLanguage === 'vi' && word.vietnameseDefinition && (
                            <p className="mt-1 text-[#6f665a] dark:text-[#aaa497]">{word.vietnameseDefinition}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="m-0 flex-row flex-wrap items-center justify-between gap-3 border-t border-[#efe7d8] bg-[#fffaf0] px-7 py-4 sm:px-8 dark:border-[#d7a94b]/20 dark:bg-black/10">
            <p className="hidden text-xs font-medium text-[#7a7060] sm:block dark:text-[#aaa497]">
              {lang === 'vi'
                ? `${cards.length} từ trong chủ đề`
                : `${cards.length} words in this topic`}
            </p>
            {cards.length > REVIEW_WORDS_PAGE_SIZE && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7a7060] dark:text-[#d8d0bd]">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={reviewedWordsCurrentPage <= 1}
                  onClick={() => setReviewWordsPage((page) => Math.max(page - 1, 1))}
                  className="border-[#ded8cc] bg-white hover:border-[#d4a853] hover:bg-[#fff8e8] disabled:opacity-50 dark:border-[#34312d] dark:bg-[#171614] dark:hover:border-[#d4b05a]/70 dark:hover:bg-[#d4b05a]/10"
                  aria-label={lang === 'vi' ? 'Trang trước' : 'Previous page'}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span>
                  {reviewedWordsCurrentPage} / {reviewedWordsTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={reviewedWordsCurrentPage >= reviewedWordsTotalPages}
                  onClick={() => setReviewWordsPage((page) => Math.min(page + 1, reviewedWordsTotalPages))}
                  className="border-[#ded8cc] bg-white hover:border-[#d4a853] hover:bg-[#fff8e8] disabled:opacity-50 dark:border-[#34312d] dark:bg-[#171614] dark:hover:border-[#d4b05a]/70 dark:hover:bg-[#d4b05a]/10"
                  aria-label={lang === 'vi' ? 'Trang sau' : 'Next page'}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-10 border-[#ded8cc] bg-white font-semibold text-[#374151] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#d8d4ca] dark:hover:border-[#d4b05a]/70 dark:hover:bg-[#d4b05a]/10 dark:hover:text-[#f2c85f]"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VocabularyShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        lang={lang}
        mode={mode}
        includePrevious
        alwaysShowFlip
      />
      <VocabularySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        lang={lang}
        showTranslation={showTranslation}
        onShowTranslationChange={setShowTranslation}
        showNotes={showNotes}
        onShowNotesChange={setShowNotes}
        soundEnabled={soundEnabled}
        onSoundEnabledChange={setSoundEnabled}
        preferredAccent={accent}
        onPreferredAccentChange={setAccent}
      />
      <Dialog
        open={restartDialogOpen}
        onOpenChange={(open) => {
          setRestartDialogOpen(open)
          if (!open) setShuffleOnRestart(false)
        }}
      >
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#ded8cc] bg-white p-0 shadow-2xl ring-0 sm:max-w-md dark:border-[#34312d] dark:bg-[#171614]">
          <DialogHeader className="px-6 pb-4 pt-7 text-center">
            <DialogTitle className="text-center text-xl font-bold text-[#24284f] dark:text-[#e8e3d8]">
              {lang === 'vi' ? 'Xác nhận ôn lại nhóm này' : 'Review this group again?'}
            </DialogTitle>
            <DialogDescription className="pt-2 text-center text-sm text-[#6b7280] dark:text-[#aaa497]">
              {lang === 'vi'
                ? 'Bạn có chắc chắn muốn ôn lại nhóm này từ đầu?'
                : 'Are you sure you want to review this group again from the beginning?'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#ded8cc] bg-[#faf8f3] px-4 py-3 text-left dark:border-[#34312d] dark:bg-[#12110f]">
              <span>
                <span className="block text-sm font-semibold text-[#374151] dark:text-[#d8d4ca]">
                  {lang === 'vi' ? 'Xáo trộn thứ tự từ' : 'Shuffle word order'}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#6b7280] dark:text-[#aaa497]">
                  {lang === 'vi'
                    ? 'Tạo một thứ tự ngẫu nhiên mới cho lần ôn lại này.'
                    : 'Create a new random order for this review.'}
                </span>
              </span>
              <SwitchPrimitive.Root
                checked={shuffleOnRestart}
                onCheckedChange={setShuffleOnRestart}
                aria-label={lang === 'vi' ? 'Xáo trộn thứ tự từ' : 'Shuffle word order'}
                className="relative h-6 w-10 shrink-0 rounded-full bg-[#d8d1c4] outline-none transition data-[state=checked]:bg-[#d4a853] focus-visible:ring-2 focus-visible:ring-[#d4a853]/40 dark:bg-[#494640] dark:data-[state=checked]:bg-[#d4b05a]"
              >
                <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px] dark:bg-[#171614]" />
              </SwitchPrimitive.Root>
            </label>
          </div>

          <DialogFooter className="m-0 grid grid-cols-2 gap-3 border-t border-[#edf0f4] bg-white px-6 py-4 dark:border-[#2e2c29] dark:bg-[#171614]">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-10 border-[#ded8cc] bg-white font-semibold text-[#374151] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-[#34312d] dark:bg-[#171614] dark:text-[#d8d4ca]"
              >
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => restartReviewSession(shuffleOnRestart)}
              className="h-10 bg-[#d4a853] font-semibold text-white hover:bg-[#bd9140] dark:bg-[#d4b05a] dark:text-[#171614] dark:hover:bg-[#c29f4f]"
            >
              <RotateCcw className="size-4" />
              {lang === 'vi' ? 'Xác nhận ôn lại' : 'Confirm review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VocabularyReportDialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open)
          if (!open) setReportDescription('')
        }}
        lang={lang}
        word={card?.word ?? ''}
        description={reportDescription}
        onDescriptionChange={setReportDescription}
        onSubmit={submitReport}
      />
    </div>
  )
}

function ReviewMessage({
  title,
  description,
  lang,
  completed = false,
  onBack,
  onViewVocabulary,
  onStudyNext,
  onStudyAgain,
  hasNextTopic = false,
  finalTopic = false,
}: {
  title: string
  description: string
  lang: 'vi' | 'en'
  completed?: boolean
  onBack: () => void
  onViewVocabulary?: () => void
  onStudyNext?: () => void
  onStudyAgain?: () => void
  hasNextTopic?: boolean
  finalTopic?: boolean
}) {
  const showCompletionActions = Boolean(completed && onViewVocabulary && onStudyNext && onStudyAgain)

  return (
    <div className="relative flex min-h-[440px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#e5d4ad] bg-gradient-to-br from-white via-[#fffdf8] to-[#fff4d8] px-4 py-8 text-center shadow-[0_16px_50px_rgba(91,67,23,0.10)] sm:min-h-[520px] sm:px-6 dark:border-[#594526] dark:from-[#171614] dark:via-[#1d1912] dark:to-[#2a2115]">
      <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-[#f4cf72]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-700/10" />

      <div className="relative flex size-24 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 shadow-[0_10px_30px_rgba(16,185,129,0.18)] ring-8 ring-emerald-100/60 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-900/30">
        <CheckCircle2 className="size-11" />
      </div>

      <div className="mt-7 rounded-full border border-[#e5d4ad] bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#9a6b18] shadow-sm backdrop-blur dark:border-[#66502b] dark:bg-[#171614]/70 dark:text-[#d4b05a]">
        {completed && finalTopic
          ? (lang === 'vi' ? 'Hoàn tất chủ đề' : 'Topic completed')
          : (lang === 'vi' ? 'Đã ôn xong' : 'All caught up')}
      </div>

      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#24284f] dark:text-[#f1ecdf]">{title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#6b7280] dark:text-[#aaa497]">{description}</p>

      {showCompletionActions && (
        <>
          <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={onViewVocabulary}
              className="h-12 rounded-xl border-[#ded8cc] bg-white/80 font-semibold text-[#374151] hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:border-white/10 dark:bg-black/10 dark:text-[#f2eadc] dark:hover:border-[#d4b05a]/70 dark:hover:bg-[#d4b05a]/10 dark:hover:text-[#f2c85f]"
            >
              <List className="size-4" />
              {lang === 'vi' ? 'Xem từ vựng' : 'View vocabulary'}
            </Button>
            <Button
              onClick={onStudyNext}
              disabled={!hasNextTopic}
              className="h-12 rounded-xl bg-[#d4a853] font-bold text-white shadow-[0_8px_24px_rgba(212,168,83,0.22)] hover:bg-[#bd9140] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#d4b05a] dark:text-[#11100e] dark:hover:bg-[#e2ba61]"
            >
              <BookOpen className="size-4" />
              {hasNextTopic
                ? (lang === 'vi' ? 'Ôn nhóm tiếp theo' : 'Review next group')
                : (lang === 'vi' ? 'Hoàn tất bộ từ' : 'Finish deck')}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onStudyAgain}
            className="mt-4 h-10 font-semibold text-[#7a7060] hover:bg-[#f1eee7] hover:text-[#9a6b18] dark:text-[#b8ad9b] dark:hover:bg-white/5 dark:hover:text-[#f2c85f]"
          >
            <RotateCcw className="size-4" />
            {lang === 'vi' ? 'Ôn lại từ đầu' : 'Review again'}
          </Button>
        </>
      )}

      <Button
        onClick={onBack}
        className={cn(
          'mt-8 h-11 rounded-xl border border-[#bd9140] bg-gradient-to-r from-[#d4a853] to-[#c69335] px-6 font-bold text-white shadow-[0_8px_20px_rgba(180,127,29,0.24)] transition hover:-translate-y-0.5 hover:from-[#c89c47] hover:to-[#b8832e] hover:shadow-[0_12px_24px_rgba(180,127,29,0.30)] dark:text-[#171614]',
          showCompletionActions && 'hidden',
        )}
      >
        <ArrowLeft className="size-4" />
        {lang === 'vi' ? 'Quay về từ vựng' : 'Back to vocabulary'}
      </Button>
    </div>
  )
}
