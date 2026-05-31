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
      <DialogContent className="w-full max-w-lg bg-white dark:bg-[#1a1d27] rounded-2xl p-8 border border-gray-200 dark:border-[#2e3142]">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>
            Chọn chế độ học
          </DialogTitle>
          <DialogDescription className="text-sm" style={{ color: '#9ca3af' }}>
            Chọn chế độ học phù hợp với bạn nhất
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {lesson.hasDictation && (
            <Button
              variant="outline"
              className="rounded-2xl p-6 h-auto flex flex-col items-center gap-4 transition-all hover:shadow-md hover:border-blue-300 border-[1.5px] border-gray-200 dark:border-[#2e3142] bg-white dark:bg-[#1a1d27]"
              onClick={() => {
                router.push(`/dashboard/learn/dictation/${lesson.id}`)
                onClose()
              }}
            >
              <div className="text-6xl">🐦</div>
              <span className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>
                ✏️ Nghe - Viết chính tả
              </span>
            </Button>
          )}

          {lesson.hasShadowing && (
            <Button
              variant="outline"
              className="rounded-2xl p-6 h-auto flex flex-col items-center gap-4 transition-all hover:shadow-md hover:border-blue-300 border-[1.5px] border-gray-200 dark:border-[#2e3142] bg-white dark:bg-[#1a1d27]"
              onClick={() => {
                router.push(`/dashboard/learn/shadowing/${lesson.id}`)
                onClose()
              }}
            >
              <div className="text-6xl">🦜</div>
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
