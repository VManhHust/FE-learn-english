export interface BilingualSegment {
  segmentIndex: number
  startTime: number
  endTime: number
  text: string
  translation: string | null
}

export type LearningMode = 'bilingual' | 'dictation'
export type LanguageTab = 'both' | 'english' | 'vietnamese'
export type DictationSubmode = 'full' | 'fill-blank'

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
}

export interface DictationSession {
  results: Record<number, SegmentResult>
  currentIdx: number
  submode: DictationSubmode
}
