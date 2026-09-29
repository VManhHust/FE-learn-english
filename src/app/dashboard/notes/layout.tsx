import Sidebar from '@/components/layout/Sidebar'
import TopicsHeader from '@/components/layout/TopicsHeader'

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport-shell flex min-h-0 flex-col overflow-hidden overscroll-none bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <TopicsHeader />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="min-h-0 min-w-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] bg-[#f5f3ef] dark:bg-[#0f0e0c]">
          {children}
        </div>
      </div>
    </div>
  )
}
