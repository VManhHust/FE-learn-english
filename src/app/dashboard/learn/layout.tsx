import Sidebar from '@/components/layout/Sidebar'
import TopicsHeader from '@/components/layout/TopicsHeader'

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-viewport-shell flex h-[100dvh] min-h-0 flex-col overflow-hidden overscroll-none bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <TopicsHeader />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
