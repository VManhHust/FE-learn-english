import type { Metadata } from 'next'
import { getTopicLessons } from '@/lib/api/public'
import { courseJsonLd } from '@/lib/seo/jsonld'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getTopicLessons(slug)

  if (!data) {
    return {
      title: 'Bài học tiếng Anh',
      description:
        'Luyện nghe nói tiếng Anh qua các bài học thực tế với phương pháp Dictation và Shadowing trên LinguaFlow.',
    }
  }

  const title = data.topicName
  const description = `Học tiếng Anh chủ đề "${data.topicName}" với ${data.totalElements} bài học Dictation & Shadowing thực tế trên LinguaFlow.`
  const thumbnail = data.content[0]?.thumbnail
    ? data.content[0].thumbnail
    : data.content[0]?.youtubeId
      ? `https://img.youtube.com/vi/${data.content[0].youtubeId}/hqdefault.jpg`
      : undefined

  return {
    title,
    description,
    alternates: { canonical: `/topics/${slug}` },
    openGraph: {
      title: `${title} | LinguaFlow`,
      description,
      url: `${BASE_URL}/topics/${slug}`,
      ...(thumbnail && { images: [{ url: thumbnail, width: 480, height: 360 }] }),
    },
  }
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getTopicLessons(slug)

  const DashboardTopicPage = (await import('@/app/dashboard/topics/[slug]/page')).default

  return (
    <>
      {data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              courseJsonLd({
                name: data.topicName,
                description: `Học tiếng Anh chủ đề "${data.topicName}" với ${data.totalElements} bài học thực tế.`,
                slug,
              }),
            ),
          }}
        />
      )}
      <DashboardTopicPage />
    </>
  )
}
