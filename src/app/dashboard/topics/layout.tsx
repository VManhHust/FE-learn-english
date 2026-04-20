import Sidebar from '@/components/layout/Sidebar'
import TopicsHeader from '@/components/layout/TopicsHeader'

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#0f1117]">
      <TopicsHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto bg-gray-50 dark:bg-[#0f1117]">
          {children}
        </div>
      </div>
    </div>
  )
}
