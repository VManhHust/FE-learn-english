import { axiosInstance } from '../auth/authClient'

export interface VocabularyBankEntry {
  id: number
  word: string
  addedAt: string // ISO-8601
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // current page (0-indexed)
  size: number
}

export const vocabularyBankApi = {
  async save(word: string): Promise<VocabularyBankEntry> {
    const response = await axiosInstance.post<VocabularyBankEntry>(
      '/api/v1/vocabulary-bank',
      { word }
    )
    return response.data
  },

  async list(
    page = 0,
    size = 20
  ): Promise<PagedResponse<VocabularyBankEntry>> {
    const response = await axiosInstance.get<PagedResponse<VocabularyBankEntry>>(
      '/api/v1/vocabulary-bank',
      { params: { page, size } }
    )
    return response.data
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/vocabulary-bank/${id}`)
  },
}
