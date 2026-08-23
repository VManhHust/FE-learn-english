import DashboardLayout from '@/app/dashboard/layout'
import LearnLayout from '@/app/dashboard/learn/layout'

export default function LearnRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <LearnLayout>{children}</LearnLayout>
    </DashboardLayout>
  )
}
