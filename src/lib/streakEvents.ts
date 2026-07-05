export const LEARNING_COMPLETED_EVENT = 'learning:completed'

export type LearningCompletedSource = 'video' | 'vocabulary' | 'vocabulary-review'

export function notifyLearningCompleted(source: LearningCompletedSource) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LEARNING_COMPLETED_EVENT, { detail: { source } }))
}
