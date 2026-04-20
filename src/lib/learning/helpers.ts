import { WordResult } from './types'

/** Tách text thành mảng token: từ + dấu câu */
export function tokenize(text: string): string[] {
  return text.match(/[\w']+|[^\w\s]/g) || []
}

/** Chỉ lấy từ thực (bỏ dấu câu) */
export function tokenizeWords(text: string): string[] {
  return (text.match(/[\w']+/g) || [])
}

/** So sánh từng từ không phân biệt hoa thường */
export function compareWords(userInput: string, expectedWords: string[]): WordResult[] {
  const userWords = userInput.trim().split(/\s+/).filter(Boolean)
  return expectedWords.map((word, i) => {
    const userWord = userWords[i] ?? ''
    return {
      word,
      userWord,
      correct: userWord.trim().toLowerCase() === word.toLowerCase(),
    }
  })
}

/** Tính phần trăm hoàn thành */
export function calculateProgress(processed: number, total: number): number {
  return total > 0 ? Math.round((processed / total) * 100) : 0
}

/** Tạo mask ngẫu nhiên 30–50% từ thực, dấu câu luôn false */
export function generateMasks(text: string): boolean[] {
  const tokens = tokenize(text)
  const wordIndices = tokens
    .map((t, i) => (/[\w']/.test(t) ? i : -1))
    .filter(i => i >= 0)

  if (wordIndices.length < 2) return tokens.map(() => false)

  const ratio = 0.3 + Math.random() * 0.2
  const targetCount = Math.max(1, Math.round(wordIndices.length * ratio))

  // Shuffle word indices và chọn targetCount vị trí để mask
  const shuffled = [...wordIndices].sort(() => Math.random() - 0.5)
  const maskedSet = new Set(shuffled.slice(0, targetCount))

  return tokens.map((_, i) => maskedSet.has(i))
}

/** Tính điểm fill-blank: chỉ tính các vị trí mask=true */
export function scoreFillBlank(
  masks: boolean[],
  answers: string[],
  words: string[]
): number {
  const maskedIndices = masks
    .map((m, i) => (m ? i : -1))
    .filter(i => i >= 0)

  if (maskedIndices.length === 0) return 100

  const correct = maskedIndices.filter(i => {
    const answer = (answers[i] ?? '').trim().toLowerCase()
    const expected = (words[i] ?? '').toLowerCase()
    return answer === expected
  }).length

  return Math.round((correct / maskedIndices.length) * 100)
}
