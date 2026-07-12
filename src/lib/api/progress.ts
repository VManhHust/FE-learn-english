import { axiosInstance } from '../auth/authClient'
import type { SegmentResult } from '../learning/types'

/**
 * Request payload for saving learning progress.
 */
export interface SaveProgressRequest {
  lessonId: number
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
   * Get learning progress for a specific lesson.
   * 
   * @param lessonId the lesson ID
   * @returns the progress response if found
   * @throws 404 error if no progress found
   */
  async getProgress(lessonId: number): Promise<ProgressResponse> {
    const response = await axiosInstance.get<ProgressResponse>(
      '/api/v1/progress',
      {
        params: { lessonId },
      }
    )
    return response.data
  },

  /**
   * Reset learning progress for a specific lesson.
   * Clears all segment results and user inputs.
   * 
   * @param lessonId the lesson ID
   */
  async resetProgress(lessonId: number): Promise<void> {
    await axiosInstance.delete('/api/v1/progress', {
      params: { lessonId },
    })
  },

  /**
   * Get all completed exercises for the authenticated user.
   * 
   * @returns list of completed exercises
   */
  async getCompletedExercises(): Promise<ProgressResponse[]> {
    const response = await axiosInstance.get<ProgressResponse[]>(
      '/api/v1/progress/completed'
    )
    return response.data
  },
}
