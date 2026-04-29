export interface VideoNoteResponse {
  id: number
  videoTitle: string
  videoId: number
  englishText: string
  vietnameseText: string | null
  noteContent: string
  createdAt: string
}

export interface CreateVideoNoteRequest {
  exerciseModuleId: number
  noteContent: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
