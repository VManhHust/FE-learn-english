import Sidebar from '@/components/layout/Sidebar'
import TopicsHeader from '@/components/layout/TopicsHeader'

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-viewport-shell flex h-screen h-[100dvh] min-h-0 flex-col overflow-hidden overscroll-none bg-white dark:bg-[#0f0e0c]">
      <TopicsHeader />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="mobile-scroll-bottom-safe min-h-0 min-w-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] sm:pb-0 bg-gray-50 dark:bg-[#0f0e0c]">
          {children}
        </div>
      </div>
    </div>
  )
}
