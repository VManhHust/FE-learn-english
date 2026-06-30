import { vocabularyApi } from '@/lib/api/vocabulary'

type Accent = 'US' | 'UK'

let activeAudio: HTMLAudioElement | null = null
let stopActiveAudio: (() => void) | null = null

export async function playVocabularyPronunciation({
  word,
  accent,
  audioUrl,
}: {
  word: string
  accent: Accent
  audioUrl?: string | null
}) {
  let resolvedAudioUrl = audioUrl
  if (!resolvedAudioUrl) {
    try {
      resolvedAudioUrl = (await vocabularyApi.getPronunciation(word, accent)).audioUrl
    } catch {
      // The browser voice remains available when Oxford audio cannot be loaded.
    }
  }

  if (resolvedAudioUrl) {
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      stopActiveAudio?.()
      const audio = new Audio(resolvedAudioUrl)
      activeAudio = audio
      await new Promise<void>((resolve) => {
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          audio.onended = null
          audio.onerror = null
          if (activeAudio === audio) activeAudio = null
          if (stopActiveAudio === stop) stopActiveAudio = null
          resolve()
        }
        const stop = () => {
          audio.pause()
          audio.currentTime = 0
          finish()
        }
        stopActiveAudio = stop
        audio.onended = finish
        audio.onerror = finish
        void audio.play().catch(finish)
      })
      return
    } catch {
      // Fall through to the browser voice if the remote audio cannot play.
    }
  }

  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = accent === 'US' ? 'en-US' : 'en-GB'
  await new Promise<void>((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}
