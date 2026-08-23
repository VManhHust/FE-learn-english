import DashboardLayout from '@/app/dashboard/layout'
import NotesLayout from '@/app/dashboard/notes/layout'

export default function NotesRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <NotesLayout>{children}</NotesLayout>
    </DashboardLayout>
  )
}
