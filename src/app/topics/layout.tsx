import DashboardLayout from '@/app/dashboard/layout'
import TopicsLayout from '@/app/dashboard/topics/layout'

export default function TopicsRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <TopicsLayout>{children}</TopicsLayout>
    </DashboardLayout>
  )
}
