export interface BilingualSegment {
  segmentIndex: number
  startTime: number
  endTime: number
  text: string
  translation: string | null
  exerciseModuleId?: number
}

export type LearningMode = 'bilingual' | 'dictation'
export type LanguageTab = 'both' | 'english' | 'vietnamese'

export interface WordResult {
  word: string
  userWord: string
  correct: boolean
}

export interface SegmentResult {
  segmentIndex: number
  checked: boolean
  skipped: boolean
  accuracy: number
  isGood: boolean
  attemptCount?: number // Số lần kiểm tra (bao gồm cả đúng và sai)
  errorCount?: number // Số lần kiểm tra sai (accuracy < 80%)
}

export interface DictationSession {
  results: Record<number, SegmentResult>
  currentIdx: number
}
