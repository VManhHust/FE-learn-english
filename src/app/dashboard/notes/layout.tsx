import Sidebar from '@/components/layout/Sidebar'
import TopicsHeader from '@/components/layout/TopicsHeader'

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#000000]">
      <TopicsHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-y-auto bg-gray-50 dark:bg-[#000000]">
          {children}
        </div>
      </div>
    </div>
  )
}
