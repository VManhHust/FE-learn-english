import { WordResult } from './types'

/** Tách text thành mảng token: từ + dấu câu */
export function tokenize(text: string): string[] {
  if (!text) return []
  return text.match(/[\w']+|[^\w\s]/g) || []
}

/** Chỉ lấy từ thực (bỏ dấu câu) */
export function tokenizeWords(text: string): string[] {
  if (!text) return []
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

/** Tạo mask cố định: cách 1 từ che 1 từ (từ thứ 2, 4, 6...), dấu câu luôn false */
export function generateMasks(text: string): boolean[] {
  const tokens = tokenize(text)
  let wordCount = 0
  
  return tokens.map((token) => {
    // Nếu là dấu câu, không mask
    if (!/[\w']/.test(token)) {
      return false
    }
    
    // Đếm từ thực
    wordCount++
    
    // Mask các từ chẵn (từ thứ 2, 4, 6...)
    return wordCount % 2 === 0
  })
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
