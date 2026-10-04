import type { Metadata } from 'next'
import { getLessonDetail } from '@/lib/api/public'
import { videoObjectJsonLd } from '@/lib/seo/jsonld'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const lesson = await getLessonDetail(id)

  if (!lesson) {
    return {
      title: 'Luyện Dictation',
      description:
        'Luyện nghe chép tiếng Anh (Dictation) với video thực tế. Cải thiện khả năng nghe hiểu và phát âm trên LinguaFlow.',
    }
  }

  const title = lesson.title
  const description = `Luyện Dictation bài "${lesson.title}" trên LinguaFlow. Cải thiện nghe hiểu tiếng Anh với video thực tế.`
  const thumbnail = lesson.thumbnailUrl || `https://img.youtube.com/vi/${lesson.videoId}/hqdefault.jpg`

  return {
    title,
    description,
    alternates: { canonical: `/learn/dictation/${id}` },
    openGraph: {
      title: `${title} | LinguaFlow`,
      description,
      url: `${BASE_URL}/learn/dictation/${id}`,
      images: [{ url: thumbnail, width: 480, height: 360 }],
      type: 'article',
    },
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const lesson = await getLessonDetail(id)

  const DashboardLessonPage = (await import('@/app/dashboard/learn/dictation/[id]/page')).default

  return (
    <>
      {lesson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              videoObjectJsonLd({
                name: lesson.title,
                description: `Luyện Dictation bài "${lesson.title}" trên LinguaFlow.`,
                youtubeId: lesson.videoId,
                lessonId: id,
                ...(lesson.durationSeconds && {
                  duration: `PT${Math.floor(lesson.durationSeconds / 60)}M${lesson.durationSeconds % 60}S`,
                }),
              }),
            ),
          }}
        />
      )}
      <DashboardLessonPage />
    </>
  )
}
