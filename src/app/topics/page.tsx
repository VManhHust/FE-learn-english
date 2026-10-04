import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chủ đề học tiếng Anh',
  description:
    'Khám phá các chủ đề học tiếng Anh đa dạng: giao tiếp, kinh doanh, du lịch, phim ảnh, tin tức, IELTS, TOEIC. Luyện nghe nói với Dictation và Shadowing.',
  alternates: { canonical: '/topics' },
  openGraph: {
    title: 'Chủ đề học tiếng Anh | LinguaFlow',
    description: 'Khám phá hàng trăm chủ đề học tiếng Anh qua Dictation và Shadowing.',
  },
}

export { default } from '@/app/dashboard/topics/page'
