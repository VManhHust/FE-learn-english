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

export interface VocabularyReviewTopic {
  id: number
  slug: string
  title: string
  deckTitle: string
  reviewWordCount: number
}

export interface VocabularyPronunciation {
  ipa: string | null
  audioUrl: string | null
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

  async getDeck(deckId: string | number, topicId?: number, cardNumber?: number): Promise<VocabularyDeckDetailResponse> {
    const response = await axiosInstance.get<VocabularyDeckDetailResponse>(
      `/api/vocabulary/decks/${deckId}`,
      { params: { ...(topicId ? { topicId } : {}), ...(cardNumber ? { cardNumber } : {}) } },
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

  async resetTopicProgress(topicId: number, shuffle = false): Promise<VocabularyDeckDetailResponse> {
    const response = await axiosInstance.delete<VocabularyDeckDetailResponse>(
      `/api/vocabulary/topics/${topicId}/progress`,
      { params: { shuffle } },
    )
    return response.data
  },

  async shuffleRemainingTopicWords(topicId: number): Promise<VocabularyDeckDetailResponse> {
    const response = await axiosInstance.post<VocabularyDeckDetailResponse>(
      `/api/vocabulary/topics/${topicId}/shuffle`,
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

  async getTopicWords(topicId: number): Promise<VocabularyWordCard[]> {
    const response = await axiosInstance.get<VocabularyWordCard[]>(
      `/api/vocabulary/topics/${topicId}/words`,
    )
    return response.data
  },

  async getReviewWords(topicId?: number): Promise<VocabularyWordCard[]> {
    const response = await axiosInstance.get<VocabularyWordCard[]>('/api/vocabulary/review', {
      params: topicId ? { topicId } : {},
    })
    return response.data
  },

  async getReviewTopics(): Promise<VocabularyReviewTopic[]> {
    const response = await axiosInstance.get<VocabularyReviewTopic[]>('/api/vocabulary/review/topics')
    return response.data
  },

  async getWords(): Promise<VocabularyWordCard[]> {
    const response = await axiosInstance.get<VocabularyWordCard[]>('/api/vocabulary/words')
    return response.data
  },

  async getPronunciation(word: string, accent: 'US' | 'UK'): Promise<VocabularyPronunciation> {
    const response = await axiosInstance.get<VocabularyPronunciation>('/api/vocabulary/pronunciation', {
      params: { word, accent },
    })
    return response.data
  },

  async getReviewQuizOptions(excludeWordId: number, topicId?: number): Promise<VocabularyQuizOption[]> {
    const response = await axiosInstance.get<VocabularyQuizOption[]>('/api/vocabulary/review/options', {
      params: { excludeWordId, ...(topicId ? { topicId } : {}) },
    })
    return response.data
  },
}
