import { useEffect, useState } from 'react'
import { progressApi } from '@/lib/api/progress'
import type { DictationSession, DictationSubmode } from '@/lib/learning/types'

interface UseProgressFallbackOptions {
  lessonId: string
  submode: DictationSubmode
}

/**
 * Hook for loading learning progress with fallback to localStorage.
 * Implements server-first loading with automatic migration from localStorage.
 */
export function useProgressFallback({
  lessonId,
  submode,
}: UseProgressFallbackOptions) {
  const [session, setSession] = useState<DictationSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, submode])

  const loadProgress = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to load from server first
      const data = await progressApi.getProgress(parseInt(lessonId), submode)

      console.log('Loaded progress from server')

      // Update localStorage backup
      updateLocalStorageBackup(lessonId, submode, data)

      // Convert string keys back to numeric keys
      const results: Record<number, any> = {}
      Object.entries(data.segmentResults).forEach(([key, value]) => {
        results[parseInt(key)] = value
      })

      setSession({
        results,
        currentIdx: 0,
        submode,
      })
      setLoading(false)
      return
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No progress on server, check localStorage
        console.log('No progress on server, checking localStorage')
        const localData = loadFromLocalStorage(lessonId, submode)

        if (localData) {
          console.log('Found progress in localStorage, migrating to server')

          // Migrate to server
          try {
            const segmentResults: Record<string, any> = {}
            Object.entries(localData.results).forEach(([key, value]) => {
              segmentResults[key] = value
            })

            await progressApi.saveProgress({
              lessonId: parseInt(lessonId),
              submode,
              segmentResults,
              userInputs: getUserInputsFromLocalStorage(lessonId),
            })

            console.log('Migration to server successful')
          } catch (migrationError) {
            console.error('Failed to migrate to server:', migrationError)
            // Continue with localStorage data even if migration fails
          }

          setSession(localData)
        } else {
          // No data anywhere, initialize empty
          console.log('No progress found, initializing empty')
          setSession({
            results: {},
            currentIdx: 0,
            submode,
          })
        }

        setLoading(false)
        return
      }

      // Network error or other error
      console.error('Failed to load progress from server:', err)

      // Fallback to localStorage
      const localData = loadFromLocalStorage(lessonId, submode)

      if (localData) {
        console.log('Using localStorage fallback')
        setSession(localData)
      } else {
        console.log('No fallback data, initializing empty')
        setSession({
          results: {},
          currentIdx: 0,
          submode,
        })
      }

      setError('Failed to sync with server, using local data')
      setLoading(false)
    }
  }

  return { session, loading, error, reload: loadProgress }
}

/**
 * Load progress from localStorage.
 */
function loadFromLocalStorage(
  lessonId: string,
  submode: DictationSubmode
): DictationSession | null {
  try {
    const key = `dictation-progress-${lessonId}-${submode}`
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data)
      
      // Convert to DictationSession format
      const results: Record<number, any> = {}
      if (parsed.segmentResults) {
        Object.entries(parsed.segmentResults).forEach(([key, value]) => {
          results[parseInt(key)] = value
        })
      }

      return {
        results,
        currentIdx: 0,
        submode,
      }
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
  }
  return null
}

/**
 * Update localStorage with server data.
 */
function updateLocalStorageBackup(
  lessonId: string,
  submode: DictationSubmode,
  data: any
): void {
  try {
    const key = `dictation-progress-${lessonId}-${submode}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to update localStorage backup:', error)
  }
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
