const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LinguaFlow',
    url: BASE_URL,
    logo: `${BASE_URL}/icon.svg`,
    description: 'Nền tảng học tiếng Anh qua phương pháp Dictation và Shadowing',
    sameAs: [],
  }
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LinguaFlow',
    url: BASE_URL,
    description: 'Học tiếng Anh qua nội dung thực tế với phương pháp Dictation và Shadowing',
    inLanguage: ['vi', 'en'],
  }
}

export function faqPageJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

export function courseJsonLd(course: { name: string; description: string; slug: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    url: `${BASE_URL}/topics/${course.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'LinguaFlow',
      url: BASE_URL,
    },
    inLanguage: 'en',
    isAccessibleForFree: true,
  }
}

export function videoObjectJsonLd(video: {
  name: string
  description: string
  youtubeId: string
  lessonId: string
  duration?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    url: `${BASE_URL}/learn/dictation/${video.lessonId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
    uploadDate: new Date().toISOString(),
    ...(video.duration && { duration: video.duration }),
  }
}
