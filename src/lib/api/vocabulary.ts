import { axiosInstance } from '@/lib/auth/authClient'

export type VocabularyRating = 'NOT_MASTERED' | 'MASTERED'

export interface VocabularyDeckCard {
  id: number
  slug: string
  title: string
  category: string
  description: string
  coverColor: string
  premium: boolean
  topicCount: number
  wordCount: number
  learnerCount: number
  learnedWords: number
  completionPercentage: number
  statusLabel: string
}

export interface VocabularyDeckCategory {
  name: string
  deckCount: number
  decks: VocabularyDeckCard[]
}

export interface VocabularyDecksResponse {
  totalDecks: number
  categories: VocabularyDeckCategory[]
}

export interface VocabularyStatsResponse {
  totalWords: number
  mastered: number
  notMastered: number
  totalReviews: number
}

export interface VocabularyDeck {
  id: number
  slug: string
  title: string
  category: string
  description: string
  coverColor: string
  premium: boolean
}

export interface VocabularyTopicProgress {
  id: number
  slug: string
  title: string
  description: string
  thumbnailUrl: string | null
  sortOrder: number
  totalWords: number
  learnedWords: number
  masteredWords: number
  currentWordIndex: number
  completionPercentage: number
  completed: boolean
}

export interface VocabularyWordCard {
  id: number
  word: string
  partOfSpeech: string
  ipaUs: string | null
  ipaUk: string | null
  audioUsUrl: string | null
  audioUkUrl: string | null
  englishDefinition: string
  vietnameseDefinition: string
  vietnameseTranslation: string
  exampleSentence: string | null
  exampleSentenceVi: string | null
  imageUrl: string | null
  sortOrder: number
  learningStatus: string
}

export interface VocabularyDeckDetailResponse {
  deck: VocabularyDeck
  topics: VocabularyTopicProgress[]
  activeTopic: VocabularyTopicProgress | null
  currentCard: VocabularyWordCard | null
  currentCardNumber: number
  totalCards: number
  totalDeckWords: number
  learnedDeckWords: number
  deckCompletionPercentage: number
}

export interface VocabularyQuizOption {
  id: number
  word: string
  vietnameseTranslation: string
  englishDefinition: string
}

export const vocabularyApi = {
  async getStats(): Promise<VocabularyStatsResponse> {
    const response = await axiosInstance.get<VocabularyStatsResponse>('/api/vocabulary')
    return response.data
  },

  async getDecks(): Promise<VocabularyDecksResponse> {
    const response = await axiosInstance.get<VocabularyDecksResponse>('/api/vocabulary/decks')
    return response.data
  },

  async getDeck(deckSlug: string, topicSlug?: string, cardNumber?: number): Promise<VocabularyDeckDetailResponse> {
    const response = await axiosInstance.get<VocabularyDeckDetailResponse>(
      `/api/vocabulary/decks/${deckSlug}`,
      { params: { ...(topicSlug ? { topicSlug } : {}), ...(cardNumber ? { cardNumber } : {}) } },
    )
    return response.data
  },

  async reviewWord(wordId: number, rating: VocabularyRating): Promise<VocabularyDeckDetailResponse> {
    const response = await axiosInstance.post<VocabularyDeckDetailResponse>(
      `/api/vocabulary/words/${wordId}/review`,
      { rating },
    )
    return response.data
  },

  async resetTopicProgress(topicId: number): Promise<VocabularyDeckDetailResponse> {
    const response = await axiosInstance.delete<VocabularyDeckDetailResponse>(
      `/api/vocabulary/topics/${topicId}/progress`,
    )
    return response.data
  },

  async getQuizOptions(topicId: number, excludeWordId: number): Promise<VocabularyQuizOption[]> {
    const response = await axiosInstance.get<VocabularyQuizOption[]>(
      `/api/vocabulary/topics/${topicId}/quiz-options`,
      { params: { excludeWordId } },
    )
    return response.data
  },

  async getReviewWords(): Promise<VocabularyWordCard[]> {
    const response = await axiosInstance.get<VocabularyWordCard[]>('/api/vocabulary/review')
    return response.data
  },

  async getWords(): Promise<VocabularyWordCard[]> {
    const response = await axiosInstance.get<VocabularyWordCard[]>('/api/vocabulary/words')
    return response.data
  },

  async getReviewQuizOptions(excludeWordId: number): Promise<VocabularyQuizOption[]> {
    const response = await axiosInstance.get<VocabularyQuizOption[]>('/api/vocabulary/review/options', {
      params: { excludeWordId },
    })
    return response.data
  },
}
