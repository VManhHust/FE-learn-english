export function getLessonDisplayViews(viewCount: number | null | undefined, lessonId: number): number {
  if (typeof viewCount === 'number' && Number.isFinite(viewCount) && viewCount > 0) {
    return viewCount
  }

  // Stable temporary fallback until lesson listening statistics are available.
  return 1_200 + (Math.abs(lessonId) * 1_873) % 18_800
}
