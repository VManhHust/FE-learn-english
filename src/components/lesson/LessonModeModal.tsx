'use client'

import { useRouter } from 'next/navigation'

interface Lesson {
  id: number
  title: string
  youtubeId?: string
  hasDictation: boolean
  hasShadowing: boolean
}

interface Props {
  lesson: Lesson
  onClose: () => void
}

export default function LessonModeModal({ lesson, onClose }: Props) {
  const router = useRouter()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl p-8 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          style={{ color: '#6b7280' }}
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a1a2e' }}>Chọn chế độ học</h2>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Chọn chế độ học phù hợp với bạn nhất</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {lesson.hasDictation && (
            <button
              className="rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-md hover:border-blue-300"
              style={{ border: '1.5px solid #e5e7eb' }}
              onClick={() => {
                router.push(`/dashboard/learn/dictation/${lesson.id}`)
                onClose()
              }}
            >
              <div className="text-6xl">🐦</div>
              <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                ✏️ Nghe - Viết chính tả
              </span>
            </button>
          )}

          {lesson.hasShadowing && (
            <button
              className="rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-md hover:border-blue-300"
              style={{ border: '1.5px solid #e5e7eb' }}
              onClick={() => {
                router.push(`/dashboard/learn/shadowing/${lesson.id}`)
                onClose()
              }}
            >
              <div className="text-6xl">🦜</div>
              <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                🎤 Bắt chước phát âm
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
