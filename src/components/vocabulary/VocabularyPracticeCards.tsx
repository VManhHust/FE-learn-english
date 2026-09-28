'use client'

import { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleX,
  Eye,
  Lightbulb,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { VocabularyQuizOption, VocabularyWordCard } from '@/lib/api/vocabulary'
import { cn } from '@/lib/utils'

type GuessResult = 'correct' | 'incorrect' | null
type VocabularyContentLanguage = 'vi' | 'en'

function VocabularyCardImage({
  word,
  imageUrl,
  className,
}: {
  word: string
  imageUrl?: string | null
  className?: string
}) {
  const normalizedImageUrl = imageUrl?.trim()

  if (normalizedImageUrl) {
    return (
      <img
        src={normalizedImageUrl}
        alt={word}
        className={cn('rounded-lg border border-[#ded8cc] object-cover dark:border-[#34312d]', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-[#ded8cc] bg-[#bfefff] px-4 text-center font-bold text-[#2f356d] shadow-sm dark:border-[#34312d]',
        className,
      )}
    >
      <span className="break-words text-2xl sm:text-3xl">{word}</span>
    </div>
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

export function QuizCard({
  card,
  options,
  selectedOptionId,
  loading,
  reverse,
  contentLanguage,
  lang,
  onSelect,
  onSpeak,
}: {
  card: VocabularyWordCard
  options: VocabularyQuizOption[]
  selectedOptionId: number | null
  loading: boolean
  reverse: boolean
  contentLanguage: VocabularyContentLanguage
  lang: 'vi' | 'en'
  onSelect: (optionId: number) => void
  onSpeak: (accent: 'US' | 'UK') => void
}) {
  const answered = selectedOptionId !== null
  const correct = selectedOptionId === card.id
  const questionText = contentLanguage === 'vi'
    ? card.vietnameseTranslation
    : card.englishDefinition

  return (
    <div className="flex min-h-[440px] w-full flex-col items-center justify-center rounded-lg border border-[#d8d1c4] bg-white px-4 py-16 text-center shadow-[0_3px_0_#d8d1c4] sm:min-h-[520px] sm:px-10 sm:py-8 dark:border-[#34312d] dark:bg-[#171614] dark:shadow-[0_3px_0_#292724]">
      <div className="w-full max-w-xl">
        <h2 className="text-3xl font-bold text-[#b8832e] dark:text-[#d4b05a]">
          {reverse ? card.word : questionText}
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
        ) : contentLanguage === 'vi' ? (
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6b7280] dark:text-[#aaa497]">
            {card.vietnameseDefinition}
          </p>
        ) : null}
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
                  {reverse
                    ? (contentLanguage === 'vi'
                        ? option.vietnameseTranslation
                        : option.id === card.id
                          ? card.englishDefinition
                          : option.englishDefinition)
                    : option.word}
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

export function composeGuessAnswer(word: string, value: string, revealedHintIndexes: number[]) {
  const typedLetters = Array.from(value).filter((character) => /[a-z]/i.test(character))
  const hintedIndexes = new Set(revealedHintIndexes)
  let typedIndex = 0

  return Array.from(word).map((character, characterIndex) => {
    if (!/[a-z]/i.test(character) || hintedIndexes.has(characterIndex)) return character
    return typedLetters[typedIndex++] ?? ''
  }).join('')
}

export function GuessCard({
  card,
  value,
  result,
  answerRevealed,
  revealedHintIndexes,
  lang,
  onChange,
  onHint,
  onPlay,
  onUnknown,
  onCheck,
  onReset,
  onSpeak,
  onReport,
  showTranslation = true,
  showNotes = true,
  contentLanguage,
}: {
  card: VocabularyWordCard
  value: string
  result: GuessResult
  answerRevealed: boolean
  revealedHintIndexes: number[]
  lang: 'vi' | 'en'
  onChange: (value: string) => void
  onHint: () => void
  onPlay: () => void
  onUnknown: () => void
  onCheck: () => void
  onReset: () => void
  onSpeak: (accent: 'US' | 'UK') => void
  onReport?: () => void
  showTranslation?: boolean
  showNotes?: boolean
  contentLanguage: VocabularyContentLanguage
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const escapedWord = card.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const letterIndexes = Array.from(card.word)
    .map((character, index) => (/[a-z]/i.test(character) ? index : -1))
    .filter((index) => index >= 0)
  const hintLimit = Math.floor(letterIndexes.length / 2) + 1
  const hintLimitReached = revealedHintIndexes.length >= hintLimit
  const wordCharacters = Array.from(card.word)
  const typedLetterCharacters = Array.from(value).filter((character) => /[a-z]/i.test(character))
  const revealedHintIndexSet = new Set(revealedHintIndexes)
  const unhintedLetterIndexes = letterIndexes.filter((index) => !revealedHintIndexSet.has(index))
  const lastHintedLetterPosition = revealedHintIndexes.reduce(
    (lastPosition, characterIndex) => Math.max(lastPosition, letterIndexes.indexOf(characterIndex)),
    -1,
  )
  const lastTypedCharacterIndex = typedLetterCharacters.length > 0
    ? unhintedLetterIndexes[Math.min(typedLetterCharacters.length - 1, unhintedLetterIndexes.length - 1)]
    : undefined
  const activeLetterPosition = lastTypedCharacterIndex !== undefined
    ? letterIndexes.indexOf(lastTypedCharacterIndex)
    : Math.max(lastHintedLetterPosition, 0)
  const guessComplete = typedLetterCharacters.length === unhintedLetterIndexes.length
  const clozeExample = card.exampleSentence?.replace(new RegExp(escapedWord, 'gi'), '_____')
  const selectedVietnameseDefinition = contentLanguage === 'vi'
    ? card.vietnameseDefinition
    : null

  useEffect(() => {
    if (result === null) {
      const input = inputRef.current
      input?.focus()
      input?.setSelectionRange(input.value.length, input.value.length)
    }
  }, [activeLetterPosition, card.id, result, revealedHintIndexes.length])

  const answerFace = (
    <div
      inert={!answerRevealed}
      aria-hidden={!answerRevealed}
      className={cn(
        'absolute inset-0 touch-pan-y overflow-y-auto overscroll-y-auto px-5 py-8 [backface-visibility:hidden] sm:px-8',
        answerRevealed ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      style={{ transform: 'rotateY(180deg)' }}
    >
      {onReport && (
        <button
          type="button"
          aria-label={lang === 'vi' ? 'Báo lỗi từ vựng' : 'Report vocabulary issue'}
          title={lang === 'vi' ? 'Báo lỗi' : 'Report issue'}
          onClick={onReport}
          className="absolute left-5 top-5 z-10 flex size-8 items-center justify-center rounded-lg text-[#7a8495] transition hover:bg-[#fff8e8] hover:text-[var(--accent-gold)] dark:text-[#9f998c] dark:hover:bg-[#2a2115]"
        >
          <AlertTriangle className="size-4" />
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="absolute right-5 top-5 rounded-lg border border-transparent text-[#374151] transition-colors hover:border-[#d4a853] hover:bg-[#fff8e8] hover:text-[#9a6b18] dark:text-[#d8d4ca] dark:hover:border-[#d4b05a] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
      >
        <RotateCcw className="size-4" />
        {lang === 'vi' ? 'Lật lại' : 'Flip back'}
      </Button>

      <div className="mx-auto flex w-full max-w-3xl flex-col pt-2">
        <div className="text-center">
          <VocabularyCardImage
            word={card.word}
            imageUrl={card.imageUrl}
            className="mx-auto mb-3 h-32 w-32 border-[#ead9b5] dark:border-[#594526]"
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-[#24284f] dark:text-[#e8e3d8]">{card.word}</h2>
            <Badge variant="outline" className="rounded-md border-[#ded8cc] text-xs text-[#6b7280] dark:border-[#494640]">
              {getPartOfSpeechLabel(card.partOfSpeech, lang)}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[#4b5563] dark:text-[#aaa497]">
            <button type="button" onClick={() => onSpeak('US')} className="flex items-center gap-1.5 hover:text-[#d4a853]">
              US: {card.ipaUs} <Volume2 className="size-4" />
            </button>
            <button type="button" onClick={() => onSpeak('UK')} className="flex items-center gap-1.5 hover:text-[#d4a853]">
              UK: {card.ipaUk} <Volume2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="my-4 border-t border-[#e5e0d7] dark:border-[#34312d]" />

        {showTranslation && (
          <h3 className="text-center text-xl font-bold text-[#b8832e] dark:text-[#d4b05a]">
            {contentLanguage === 'vi' ? card.vietnameseTranslation : card.englishDefinition}
          </h3>
        )}
        {showNotes && <div className="mt-4 space-y-4 text-sm leading-6 text-[#374151] dark:text-[#c4bfb0]">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
              {lang === 'vi' ? 'Định nghĩa' : 'Definition'}
            </p>
            {card.englishDefinition && <p>{card.englishDefinition}</p>}
            {selectedVietnameseDefinition && <p>{selectedVietnameseDefinition}</p>}
          </div>
          {card.exampleSentence && (
            <div>
              <div className="mb-1 flex items-center gap-4 text-xs font-bold uppercase text-[#7a7060] dark:text-[#8f897d]">
                <span>{lang === 'vi' ? 'Ví dụ' : 'Example'}</span>
                <button type="button" onClick={() => onSpeak('US')} className="flex items-center gap-1 normal-case hover:text-[#d4a853]">
                  US <Volume2 className="size-3.5" />
                </button>
                <button type="button" onClick={() => onSpeak('UK')} className="flex items-center gap-1 normal-case hover:text-[#d4a853]">
                  UK <Volume2 className="size-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="italic">
                  <HighlightedExample sentence={card.exampleSentence} word={card.word} />
                </p>
                {contentLanguage === 'vi' && card.exampleSentenceVi && (
                  <p className="italic text-[#6f665a] dark:text-[#aaa497]">
                    {card.exampleSentenceVi}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>}
      </div>
    </div>
  )

  const questionFace = (
    <div
      inert={answerRevealed}
      aria-hidden={answerRevealed}
      className={cn(
        'absolute inset-0 overflow-hidden [backface-visibility:hidden]',
        answerRevealed ? 'pointer-events-none' : 'pointer-events-auto',
      )}
    >
      {onReport && (
        <button
          type="button"
          aria-label={lang === 'vi' ? 'Báo lỗi từ vựng' : 'Report vocabulary issue'}
          title={lang === 'vi' ? 'Báo lỗi' : 'Report issue'}
          onClick={onReport}
          className="absolute left-5 top-5 z-10 flex size-8 items-center justify-center rounded-lg text-[#7a8495] transition hover:bg-[#fff8e8] hover:text-[var(--accent-gold)] dark:text-[#9f998c] dark:hover:bg-[#2a2115]"
        >
          <AlertTriangle className="size-4" />
        </button>
      )}
      <div className="flex min-h-full items-center justify-center px-4 py-10 text-center sm:px-10 sm:py-8">
        <div className="w-full max-w-2xl">
          <VocabularyCardImage
            word={card.word}
            imageUrl={card.imageUrl}
            className="mx-auto mb-4 h-32 w-32 border-[#ead9b5] dark:border-[#594526]"
          />

          <h2 className="break-words text-3xl font-bold text-[#b8832e] dark:text-[#d4b05a]">
            {contentLanguage === 'vi' ? card.vietnameseTranslation : card.englishDefinition}
          </h2>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-[#7a7060] dark:text-[#9f998c]">
            <span>{getPartOfSpeechLabel(card.partOfSpeech, lang)}</span>
            <span aria-hidden="true">•</span>
            <button
              type="button"
              onClick={() => onSpeak('US')}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-[#fff8e8] hover:text-[#b8832e] dark:hover:bg-[#2a2115] dark:hover:text-[#d4b05a]"
            >
              {card.ipaUs || card.ipaUk || '—'}
              <Volume2 className="size-3.5" />
            </button>
          </div>

          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault()
              onCheck()
            }}
          >
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
              <p className="shrink-0 text-sm font-semibold text-[#7a7060] dark:text-[#aaa497]">
                {letterIndexes.length} {lang === 'vi' ? 'chữ cái' : 'letters'}
              </p>

              <div
                onClick={() => inputRef.current?.focus()}
                className={cn(
                  'relative flex min-h-14 max-w-full flex-wrap items-end justify-center gap-1.5 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-[#d4a853]/35',
                  result === 'correct' && 'focus-within:ring-emerald-500/40',
                  result === 'incorrect' && 'focus-within:ring-red-500/40',
                )}
              >
                {wordCharacters.map((character, index) => {
                  if (!/[a-z]/i.test(character)) {
                    return (
                      <span key={`${character}-${index}`} className="flex h-10 w-3 items-end justify-center pb-1 text-lg text-[#7a7060]">
                        {character}
                      </span>
                    )
                  }

                  const hinted = revealedHintIndexes.includes(index)
                  const letterPosition = letterIndexes.indexOf(index)
                  const unhintedLetterPosition = unhintedLetterIndexes.indexOf(index)
                  const displayedCharacter = result
                    ? character
                    : hinted
                      ? character
                      : (typedLetterCharacters[unhintedLetterPosition] ?? '')
                  const active = result === null && letterPosition === activeLetterPosition

                  return (
                    <span
                      key={`${character}-${index}`}
                      className={cn(
                        'relative flex h-11 w-8 items-center justify-center border-b-4 bg-[#faf8f3] text-lg font-bold uppercase text-[#4b5563] sm:w-10 dark:bg-[#12110f] dark:text-[#e8e3d8]',
                        hinted && 'border-[#d4a853] bg-[#fff8e8] text-[#9a6b18] dark:border-[#d4b05a] dark:bg-[#2a2115] dark:text-[#f2c85f]',
                        !hinted && 'border-[#c4bfb0] dark:border-[#494640]',
                        result === 'correct' && 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                        result === 'incorrect' && 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
                      )}
                    >
                      {displayedCharacter}
                      {active && (
                        <input
                          ref={inputRef}
                          value={value}
                          onChange={(event) => onChange(
                            Array.from(event.target.value)
                              .filter((character) => /[a-z]/i.test(character))
                              .slice(0, unhintedLetterIndexes.length)
                              .join(''),
                          )}
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          aria-label={lang === 'vi' ? 'Nhập từ cần đoán' : 'Enter your guess'}
                          className="h-6 w-px min-w-px border-0 bg-transparent p-0 text-transparent caret-[#9a6b18] outline-none dark:caret-[#f2c85f]"
                        />
                      )}
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="mx-auto mt-5 grid w-full max-w-xl grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={result !== null}
                onClick={hintLimitReached ? onPlay : onHint}
                className="h-11 min-w-0 gap-1 border-[#d4a853] bg-[#fff8e8] px-2 text-xs font-semibold text-[#9a6b18] hover:bg-[rgba(201,168,76,0.18)] sm:text-sm dark:border-[#d4b05a] dark:bg-[#2a2115] dark:text-[#d4b05a]"
              >
                {hintLimitReached ? <Volume2 className="size-4 shrink-0" /> : <Lightbulb className="size-4 shrink-0 text-[#d4a853]" />}
                <span className="truncate">
                  {hintLimitReached
                    ? (lang === 'vi' ? 'Phát' : 'Play')
                    : (lang === 'vi' ? 'Gợi ý 1 chữ' : 'Hint 1 letter')}
                </span>
              </Button>
              <Button
                type="button"
                disabled={result !== null}
                onClick={onUnknown}
                className="h-11 min-w-0 gap-1 bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600 sm:text-sm"
              >
                <Eye className="size-4 shrink-0" />
                <span className="truncate">{lang === 'vi' ? 'Không biết' : "Don't know"}</span>
              </Button>
              <Button
                type="submit"
                disabled={!guessComplete || result !== null}
                className="h-11 min-w-0 gap-1 bg-emerald-500 px-2 text-xs font-semibold text-white hover:bg-emerald-600 sm:text-sm"
              >
                <Check className="size-4 shrink-0" />
                <span className="truncate">{lang === 'vi' ? 'Kiểm tra' : 'Check'}</span>
              </Button>
            </div>
          </form>

          {clozeExample && (
            <p className="mx-auto mt-7 max-w-xl text-center text-base leading-7 text-[#4b5563] sm:text-lg dark:text-[#b8b2a6]">
              <span className="font-semibold text-[#7a7060] dark:text-[#aaa497]">
                {lang === 'vi' ? 'Câu ví dụ:' : 'Example:'}{' '}
              </span>
              {clozeExample}
            </p>
          )}

          <div className="mx-auto mt-4 h-10 max-w-xl" aria-live="polite">
            {result && (
              <div className={cn(
                'flex h-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold',
                result === 'correct'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
              )}>
                {result === 'correct' ? <Check className="size-4" /> : <X className="size-4" />}
                {result === 'correct'
                  ? (lang === 'vi' ? 'Chính xác' : 'Correct')
                  : (lang === 'vi' ? 'Không chính xác' : 'Incorrect')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      className="relative h-[600px] w-full overflow-hidden rounded-lg border border-[#d8d1c4] bg-white shadow-[0_3px_0_#d8d1c4] sm:h-[560px] dark:border-[#34312d] dark:bg-[#171614] dark:shadow-[0_3px_0_#292724]"
      style={{ perspective: '1600px' }}
    >
      <div
        className="relative h-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: answerRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {questionFace}
        {answerFace}
      </div>
    </div>
  )
}
