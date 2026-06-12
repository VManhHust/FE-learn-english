import Sidebar from '@/components/layout/Sidebar'
import TopicsHeader from '@/components/layout/TopicsHeader'

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <TopicsHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
