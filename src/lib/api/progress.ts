import { axiosInstance } from '../auth/authClient'
import type { DictationSubmode, SegmentResult } from '../learning/types'

/**
 * Request payload for saving learning progress.
 */
export interface SaveProgressRequest {
  lessonId: number
  submode: DictationSubmode
  segmentResults: Record<string, SegmentResult>
  userInputs?: Record<string, string>
  lastUpdated?: string
  totalSegments?: number
}

/**
 * Response payload for learning progress.
 */
export interface ProgressResponse {
  lessonId: number
  submode: DictationSubmode
  segmentResults: Record<string, SegmentResult>
  userInputs: Record<string, string>
  completionPercentage: number
  isCompleted: boolean
  completedAt: string | null
  updatedAt: string
}

/**
 * API client for learning progress operations.
 */
export const progressApi = {
  /**
   * Save or update learning progress.
   * 
   * @param request the progress data to save
   * @returns the saved progress response
   */
  async saveProgress(request: SaveProgressRequest): Promise<ProgressResponse> {
    const response = await axiosInstance.post<ProgressResponse>(
      '/api/v1/progress',
      request
    )
    return response.data
  },

  /**
   * Get learning progress for a specific lesson and submode.
   * 
   * @param lessonId the lesson ID
   * @param submode the dictation submode
   * @returns the progress response if found
   * @throws 404 error if no progress found
   */
  async getProgress(
    lessonId: number,
    submode: DictationSubmode
  ): Promise<ProgressResponse> {
    const response = await axiosInstance.get<ProgressResponse>(
      '/api/v1/progress',
      {
        params: { lessonId, submode },
      }
    )
    return response.data
  },

  /**
   * Reset learning progress for a specific lesson and submode.
   * Clears all segment results and user inputs.
   * 
   * @param lessonId the lesson ID
   * @param submode the dictation submode
   */
  async resetProgress(
    lessonId: number,
    submode: DictationSubmode
  ): Promise<void> {
    await axiosInstance.delete('/api/v1/progress', {
      params: { lessonId, submode },
    })
  },

  /**
   * Get all completed exercises for the authenticated user.
   * 
   * @param submode optional submode filter
   * @returns list of completed exercises
   */
  async getCompletedExercises(
    submode?: DictationSubmode
  ): Promise<ProgressResponse[]> {
    const response = await axiosInstance.get<ProgressResponse[]>(
      '/api/v1/progress/completed',
      {
        params: submode ? { submode } : undefined,
      }
    )
    return response.data
  },
}
