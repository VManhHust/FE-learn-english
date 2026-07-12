import { useCallback, useEffect, useRef } from 'react'
import { progressApi } from '@/lib/api/progress'
import type { DictationSession } from '@/lib/learning/types'
import { notifyLearningCompleted } from '@/lib/streakEvents'

interface UseProgressSyncOptions {
  lessonId: string
  session: DictationSession
  enabled: boolean
  totalSegments: number
}

/**
 * Hook for automatically syncing learning progress to the server.
 * Implements debouncing, retry logic, and localStorage backup.
 */
export function useProgressSync({
  lessonId,
  session,
  enabled,
  totalSegments,
}: UseProgressSyncOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const retryCountRef = useRef(0)
  const completedNotifiedRef = useRef(false)
  const MAX_RETRIES = 3

  const saveProgress = useCallback(
    async (immediate = false) => {
      if (!enabled) return
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      const doSave = async () => {
        // Guard: don't save empty session
        if (Object.keys(session.results).length === 0) {
          return
        }

        // Convert numeric keys to string keys for API
        const segmentResults: Record<string, any> = {}
        Object.entries(session.results).forEach(([key, value]) => {
          segmentResults[key] = value
        })

        // Get user inputs from localStorage
        const userInputs = getUserInputsFromLocalStorage(lessonId)

        // Get last updated timestamp from localStorage
        const lastUpdated = getLastUpdatedFromLocalStorage(lessonId)

        const saveRequest = {
          lessonId: parseInt(lessonId),
          segmentResults,
          userInputs,
          lastUpdated,
          totalSegments,
        }

        const handleSavedProgress = (response: Awaited<ReturnType<typeof progressApi.saveProgress>>) => {
          updateLocalStorageBackup(lessonId, response)

          if (response.isCompleted && !completedNotifiedRef.current) {
            completedNotifiedRef.current = true
            notifyLearningCompleted('video')
          }

          retryCountRef.current = 0
          console.log('Progress saved successfully')
        }

        try {
          const response = await progressApi.saveProgress(saveRequest)
          handleSavedProgress(response)
        } catch (error: any) {
          // A 409 means another save updated this lesson first. Refresh the
          // server timestamp once, then retry with the current local session.
          if (error.response?.status === 409) {
            console.warn('Progress conflict detected, retrying with latest server timestamp')

            try {
              const serverProgress = await progressApi.getProgress(parseInt(lessonId))
              updateLocalStorageBackup(lessonId, serverProgress)

              const retryResponse = await progressApi.saveProgress({
                lessonId: parseInt(lessonId),
                segmentResults,
                userInputs,
                lastUpdated: serverProgress.updatedAt,
                totalSegments,
              })

              handleSavedProgress(retryResponse)
            } catch (retryError) {
              console.warn('Progress conflict retry skipped:', retryError)
            }
            return
          }

          console.error('Failed to save progress:', error)

          // Retry with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++
            const delay = Math.pow(2, retryCountRef.current) * 1000
            console.log(
              `Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`
            )
            setTimeout(doSave, delay)
          } else {
            console.error('Max retries reached, progress not saved to server')
            retryCountRef.current = 0
          }
        }
      }

      if (immediate) {
        await doSave()
      } else {
        // Debounce saves by 1 second
        saveTimeoutRef.current = setTimeout(doSave, 1000)
      }
    },
    [lessonId, session, enabled, totalSegments]
  )

  // Auto-save when session changes and has actual data.
  useEffect(() => {
    if (Object.keys(session.results).length > 0) {
      saveProgress()
    }
  }, [session, saveProgress])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return { saveProgress }
}

/**
 * Get user inputs from localStorage.
 */
function getUserInputsFromLocalStorage(
  lessonId: string
): Record<string, string> | undefined {
  try {
    const key = `dictation-inputs-${lessonId}`
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load user inputs from localStorage:', error)
  }
  return undefined
}

/**
 * Get last updated timestamp from localStorage.
 */
function getLastUpdatedFromLocalStorage(lessonId: string): string | undefined {
  try {
    const key = `dictation-progress-${lessonId}`
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      return parsed.updatedAt
    }
  } catch (error) {
    console.error('Failed to load last updated from localStorage:', error)
  }
  return undefined
}

/**
 * Update localStorage with server data as backup.
 */
function updateLocalStorageBackup(lessonId: string, data: any): void {
  try {
    const key = `dictation-progress-${lessonId}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to update localStorage backup:', error)
  }
}

