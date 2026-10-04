import type { MetadataRoute } from 'next'
import { getTopics, getTopicLessons } from '@/lib/api/public'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/topics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  const topics = await getTopics()

  const topicRoutes: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${BASE_URL}/topics/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const lessonRoutes: MetadataRoute.Sitemap = []

  for (const topic of topics) {
    const data = await getTopicLessons(topic.slug, 0, 100)
    if (data) {
      for (const lesson of data.content) {
        if (!lesson.premium) {
          lessonRoutes.push({
            url: `${BASE_URL}/learn/dictation/${lesson.id}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
          })
        }
      }
    }
  }

  return [...staticRoutes, ...topicRoutes, ...lessonRoutes]
}
