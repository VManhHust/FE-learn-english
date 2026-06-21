export function playAnswerSound(correct: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext
    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const notes = correct
      ? [{ frequency: 880, start: 0 }, { frequency: 1320, start: 0.15 }]
      : [{ frequency: 260, start: 0 }, { frequency: 180, start: 0.16 }]

    notes.forEach(({ frequency, start }) => {
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()
      oscillator.connect(gain)
      gain.connect(audioContext.destination)
      oscillator.type = correct ? 'sine' : 'triangle'
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + start)
      gain.gain.setValueAtTime(0.22, audioContext.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + start + 0.24)
      oscillator.start(audioContext.currentTime + start)
      oscillator.stop(audioContext.currentTime + start + 0.24)
    })

    window.setTimeout(() => void audioContext.close(), 600)
  } catch (error) {
    console.error('Failed to play answer sound:', error)
  }
}
