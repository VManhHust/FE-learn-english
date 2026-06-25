'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 sm:p-8 dark:border-[#2e3142] dark:bg-[#1a1d27]">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-xl font-bold sm:text-2xl" style={{ color: '#1a1a2e' }}>
            Chọn chế độ học
          </DialogTitle>
          <DialogDescription className="text-sm" style={{ color: '#9ca3af' }}>
            Chọn chế độ học phù hợp với bạn nhất
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4">
          {lesson.hasDictation && (
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-3 rounded-2xl border-[1.5px] border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md sm:gap-4 sm:p-6 dark:border-[#2e3142] dark:bg-[#1a1d27]"
              onClick={() => {
                router.push(`/dashboard/learn/dictation/${lesson.id}`)
                onClose()
              }}
            >
              <div className="text-5xl sm:text-6xl">🐦</div>
              <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                ✏️ Nghe - Viết chính tả
              </span>
            </Button>
          )}

          {lesson.hasShadowing && (
            <Button
              variant="outline"
              className="flex h-auto flex-col items-center gap-3 rounded-2xl border-[1.5px] border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md sm:gap-4 sm:p-6 dark:border-[#2e3142] dark:bg-[#1a1d27]"
              onClick={() => {
                router.push(`/dashboard/learn/shadowing/${lesson.id}`)
                onClose()
              }}
            >
              <div className="text-5xl sm:text-6xl">🦜</div>
              <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                🎤 Bắt chước phát âm
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
