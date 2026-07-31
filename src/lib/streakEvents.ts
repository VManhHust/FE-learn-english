export const LEARNING_COMPLETED_EVENT = 'learning:completed'
export const LEARNING_ACTIVITY_UPDATED_EVENT = 'learning:activity-updated'

export type LearningCompletedSource = 'video' | 'vocabulary' | 'vocabulary-review'

export function notifyLearningCompleted(source: LearningCompletedSource) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LEARNING_COMPLETED_EVENT, { detail: { source } }))
}

export function notifyLearningActivityUpdated(source: LearningCompletedSource) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LEARNING_ACTIVITY_UPDATED_EVENT, { detail: { source } }))
}
