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

/** So sánh theo nội dung, không phân biệt hoa thường hay thứ tự nhập. */
export function compareWords(userInput: string, expectedWords: string[]): WordResult[] {
  const userWords = tokenizeWords(userInput)
  const usedUserWordIndexes = new Set<number>()

  const results = expectedWords.map((word) => {
    const expected = word.toLowerCase()
    const matchingUserWordIndex = userWords.findIndex(
      (userWord, index) => !usedUserWordIndexes.has(index) && userWord.toLowerCase() === expected,
    )

    if (matchingUserWordIndex < 0) {
      return { word, userWord: '', correct: false }
    }

    usedUserWordIndexes.add(matchingUserWordIndex)
    return {
      word,
      userWord: userWords[matchingUserWordIndex],
      correct: true,
    }
  })

  const usedExpectedWordIndexes = new Set<number>()
  results.forEach((result, index) => {
    if (result.correct) usedExpectedWordIndexes.add(index)
  })

  // Match unfinished words to the corresponding answer by prefix, regardless
  // of where that answer appears in the sentence (for example: com -> come).
  userWords.forEach((userWord, userWordIndex) => {
    if (usedUserWordIndexes.has(userWordIndex)) return
    const normalizedUserWord = userWord.toLowerCase()
    const matchingExpectedWordIndex = expectedWords.findIndex((expectedWord, expectedWordIndex) => {
      if (usedExpectedWordIndexes.has(expectedWordIndex)) return false
      const normalizedExpectedWord = expectedWord.toLowerCase()
      return normalizedUserWord.length < normalizedExpectedWord.length &&
        normalizedExpectedWord.startsWith(normalizedUserWord)
    })

    if (matchingExpectedWordIndex < 0) return
    results[matchingExpectedWordIndex] = {
      ...results[matchingExpectedWordIndex],
      userWord,
    }
    usedUserWordIndexes.add(userWordIndex)
    usedExpectedWordIndexes.add(matchingExpectedWordIndex)
  })

  const unmatchedUserWords = userWords.filter((_, index) => !usedUserWordIndexes.has(index))
  let unmatchedUserWordIndex = 0

  return results.map((result) => {
    if (result.correct || result.userWord) return result
    return {
      ...result,
      userWord: unmatchedUserWords[unmatchedUserWordIndex++] ?? '',
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
