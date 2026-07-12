import { useEffect, useState } from 'react'
import { progressApi } from '@/lib/api/progress'
import type { DictationSession } from '@/lib/learning/types'

interface UseProgressFallbackOptions {
  lessonId: string
}

/**
 * Hook for loading learning progress with fallback to localStorage.
 * Implements server-first loading with automatic migration from localStorage.
 */
export function useProgressFallback({
  lessonId,
}: UseProgressFallbackOptions) {
  const [session, setSession] = useState<DictationSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  const loadProgress = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to load from server first
      const data = await progressApi.getProgress(parseInt(lessonId))

      console.log('Loaded progress from server')

      // Update localStorage backup
      updateLocalStorageBackup(lessonId, data)

      // Convert string keys back to numeric keys
      const results: Record<number, any> = {}
      Object.entries(data.segmentResults).forEach(([key, value]) => {
        results[parseInt(key)] = value
      })

      setSession({
        results,
        currentIdx: 0,
      })
      setLoading(false)
      return
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No progress on server, check localStorage
        console.log('No progress on server, checking localStorage')
        const localData = loadFromLocalStorage(lessonId)

        if (localData) {
          console.log('Found progress in localStorage, migrating to server')

          // Migrate to server
          try {
            const segmentResults: Record<string, any> = {}
            Object.entries(localData.results).forEach(([key, value]) => {
              segmentResults[key] = value
            })

            if (Object.keys(segmentResults).length > 0) {
              await progressApi.saveProgress({
                lessonId: parseInt(lessonId),
                segmentResults,
                userInputs: getUserInputsFromLocalStorage(lessonId),
              })
            }

            console.log('Migration to server successful')
          } catch (migrationError: any) {
            const status = migrationError?.response?.status
            console.warn('Progress migration skipped' + (status ? ' (HTTP ' + status + ')' : ''))
            // Continue with sanitized localStorage data even if migration fails
          }

          setSession(localData)
        } else {
          // No data anywhere, initialize empty
          console.log('No progress found, initializing empty')
          setSession({
            results: {},
            currentIdx: 0,
          })
        }

        setLoading(false)
        return
      }

      // Network error or other error
      console.warn('Progress sync unavailable' + (err?.response?.status ? ' (HTTP ' + err.response.status + ')' : ''))

      // Fallback to localStorage
      const localData = loadFromLocalStorage(lessonId)

      if (localData) {
        console.log('Using localStorage fallback')
        setSession(localData)
      } else {
        console.log('No fallback data, initializing empty')
        setSession({
          results: {},
          currentIdx: 0,
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
function loadFromLocalStorage(lessonId: string): DictationSession | null {
  const currentKey = `dictation-progress-${lessonId}`
  const legacyKeys = [
    `dictation-progress-${lessonId}-fill-blank`,
    `dictation-progress-${lessonId}-full`,
  ]
  try {
    const legacyKey = legacyKeys.find((key) => localStorage.getItem(key))
    const key = localStorage.getItem(currentKey) ? currentKey : legacyKey
    if (!key) return null

    const data = localStorage.getItem(key)
    if (!data) return null

    const parsed = JSON.parse(data)
    const rawResults = parsed?.segmentResults ?? parsed?.results
    if (!rawResults || typeof rawResults !== 'object' || Array.isArray(rawResults)) {
      localStorage.removeItem(key)
      return null
    }

    const results: DictationSession['results'] = {}
    Object.entries(rawResults).forEach(([key, value]) => {
      const segmentIndex = Number(key)
      if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || !value || typeof value !== 'object') {
        return
      }

      const raw = value as Record<string, unknown>
      const rawAccuracy = Number(raw.accuracy)
      const accuracy = Number.isFinite(rawAccuracy)
        ? Math.min(100, Math.max(0, Math.round(rawAccuracy)))
        : 0

      results[segmentIndex] = {
        segmentIndex,
        checked: Boolean(raw.checked),
        skipped: Boolean(raw.skipped),
        accuracy,
        isGood: typeof raw.isGood === 'boolean' ? raw.isGood : accuracy >= 80,
        attemptCount: toNonNegativeInteger(raw.attemptCount),
        errorCount: toNonNegativeInteger(raw.errorCount),
      }
    })

    return {
      results,
      currentIdx: 0,
    }
  } catch {
    localStorage.removeItem(currentKey)
    legacyKeys.forEach((key) => localStorage.removeItem(key))
    return null
  }
}

function toNonNegativeInteger(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0
}

/**
 * Update localStorage with server data.
 */
function updateLocalStorageBackup(lessonId: string, data: any): void {
  try {
    const key = `dictation-progress-${lessonId}`
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
    if (!data) return undefined

    const parsed = JSON.parse(data)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      localStorage.removeItem(key)
      return undefined
    }

    const sanitized: Record<string, string> = {}
    Object.entries(parsed).forEach(([key, value]) => {
      if (/^\d+$/.test(key) && typeof value === 'string') {
        sanitized[key] = value
      }
    })
    return sanitized
  } catch {
    localStorage.removeItem(`dictation-inputs-${lessonId}`)
    return undefined
  }
}
