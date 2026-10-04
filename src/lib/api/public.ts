const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface TopicDto {
  id: number
  name: string
  slug: string
  description: string | null
  thumbnail: string | null
  lessonCount: number
  previewLessons: LessonPreviewDto[]
}

interface LessonPreviewDto {
  id: number
  title: string
  thumbnail: string | null
  duration: string
  level: string
  viewCount: number
  source: string
  youtubeId: string
  youtubeUrl: string
  premium: boolean
  completionPercentage: number | null
}

interface TopicLessonsResponse {
  topicId: number
  topicName: string
  totalElements: number
  totalPages: number
  page: number
  size: number
  content: LessonPreviewDto[]
}

interface LessonDetailDto {
  id: number
  uuid: string
  type: string
  title: string
  moduleCount: number
  vocabularyLevel: string
  videoId: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  channel: {
    id: number
    channelYoutubeId: string
    channelName: string
    channelImgUrl: string | null
    channelDescription: string | null
    subscriberCount: number | null
  } | null
  topicId: number | null
  topicName: string | null
  premium: boolean
  status: string
}

export type { TopicDto, LessonPreviewDto, TopicLessonsResponse, LessonDetailDto }

export async function getTopics(): Promise<TopicDto[]> {
  try {
    const res = await fetch(`${API_BASE}/api/topics`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getTopicLessons(
  slug: string,
  page = 0,
  size = 20,
): Promise<TopicLessonsResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/topics/${slug}/lessons?page=${page}&size=${size}&sortBy=createdAt`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getLessonDetail(id: string): Promise<LessonDetailDto | null> {
  try {
    const res = await fetch(`${API_BASE}/api/lessons/${id}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
