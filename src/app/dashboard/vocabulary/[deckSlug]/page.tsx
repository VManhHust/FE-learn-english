'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Eye,
  Headphones,
  Keyboard,
  RotateCcw,
  Settings2,
  Volume2,
} from 'lucide-react'
import TopicsHeader from '@/components/layout/TopicsHeader'
import Sidebar from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
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
  type VocabularyRating,
  type VocabularyTopicProgress,
} from '@/lib/api/vocabulary'
import { vocabularyBankApi } from '@/lib/api/vocabularyBank'
import { cn } from '@/lib/utils'

type SaveStatus = 'checking' | 'idle' | 'saving' | 'saved' | 'duplicate' | 'error'

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

  const selectTopic = (topicSlug: string) => {
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
    if (!flipped) {
      speak('US')
    }
    setFlipped((value) => !value)
  }

  const review = async (rating: VocabularyRating) => {
    if (!data?.currentCard || reviewing || viewingPrevious) return
    const currentCardId = data.currentCard.id
    setReviewing(true)
    try {
      const response = await vocabularyApi.reviewWord(currentCardId, rating)
      setData(response)
      setCurrentStudyData(response)
      setFlipped(false)
    } catch {
      setError(lang === 'vi' ? 'Không thể lưu tiến độ. Vui lòng thử lại.' : 'Unable to save progress. Please try again.')
    } finally {
      setReviewing(false)
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
                      className="rounded-lg border border-[#d4a853] bg-[rgba(201,168,76,0.1)] px-3 font-semibold text-[#b47f1d] shadow-sm hover:bg-[rgba(201,168,76,0.18)] dark:border-[#d4b05a] dark:bg-[rgba(212,176,90,0.12)] dark:text-[#d4b05a] dark:hover:bg-[rgba(212,176,90,0.2)]"
                    >
                      <Eye className="size-4" />
                      <span>Flashcard</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-lg px-3 text-[#7a7060] hover:bg-[#f5f0e8] dark:hover:bg-[#25231f]">
                      <RotateCcw className="size-4" /> {lang === 'vi' ? 'Lặp lại' : 'Repeat'}
                    </Button>
                  </div>
                  <Button variant="outline" size="icon" aria-label={lang === 'vi' ? 'Phím tắt' : 'Shortcuts'} className="border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]">
                    <Keyboard className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" aria-label={lang === 'vi' ? 'Cài đặt' : 'Settings'} className="border-[#ded8cc] bg-white dark:border-[#2e2c29] dark:bg-[#171614]">
                    <Settings2 className="size-4" />
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
                      {data.currentCardNumber} / {data.totalCards} {lang === 'vi' ? 'thẻ' : 'cards'}
                    </p>
                  </div>
                  <Progress
                    value={data.activeTopic?.completionPercentage ?? 0}
                    className="mb-4 h-2 bg-[#ded8cc] dark:bg-[#2e2c29] [&_[data-slot=progress-indicator]]:bg-[#d4a853]"
                  />

                  {error && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-950 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {data.currentCard ? (
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
                                <h3 className="mt-2 text-2xl font-bold text-[#b8832e] dark:text-[#d4b05a]">
                                  {data.currentCard.vietnameseTranslation}
                                </h3>
                              </div>

                              <div className="rounded-2xl border border-[#efe5d2] bg-[#fffdf8] p-5 shadow-sm dark:border-[#34312d] dark:bg-[#12110f]">
                                <div className="space-y-4 text-sm leading-6 text-[#374151] dark:text-[#c4bfb0]">
                                  <div>
                                    <p className="mb-1 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
                                      {lang === 'vi' ? 'Định nghĩa' : 'Definition'}
                                    </p>
                                    <p><strong>EN:</strong> {data.currentCard.englishDefinition}</p>
                                    <p><strong>VI:</strong> {data.currentCard.vietnameseDefinition}</p>
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
                                      <p className="text-[#6b7280] dark:text-[#9f998c]">{data.currentCard.exampleSentenceVi}</p>
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
