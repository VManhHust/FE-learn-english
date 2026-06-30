import StreakCheckInReminder from '@/components/layout/StreakCheckInReminder'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StreakCheckInReminder />
    </>
  )
}
