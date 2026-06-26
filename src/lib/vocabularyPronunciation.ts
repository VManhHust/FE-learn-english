import { vocabularyApi } from '@/lib/api/vocabulary'

type Accent = 'US' | 'UK'

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
      await new Audio(resolvedAudioUrl).play()
      return
    } catch {
      // Fall through to the browser voice if the remote audio cannot play.
    }
  }

  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = accent === 'US' ? 'en-US' : 'en-GB'
  window.speechSynthesis.speak(utterance)
}
