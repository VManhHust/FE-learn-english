'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, LockKeyhole, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import ThemeToggleButton from '@/components/ui/ThemeToggleButton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AccountLockedPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleBackToLogin() {
    await logout()
    router.replace('/login')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f3ef] px-4 py-10 text-[#2c2416] dark:bg-[#0f0e0c] dark:text-[#f0e8d8]">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggleButton />
      </div>

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #b8a87a 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.16,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#ede4d0] to-transparent dark:from-[#1a1d27]" />

      <Card className="relative z-10 w-full max-w-[560px] gap-0 overflow-hidden border-[#dfd2bd] bg-white/92 py-0 shadow-2xl shadow-[#7a5a22]/10 backdrop-blur dark:border-[#34312d] dark:bg-[#171614]/95">
        <CardHeader className="border-b border-[#eadfcc] bg-[#fff8e8] px-7 py-7 text-center dark:border-[#34312d] dark:bg-[#1f1c17]">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#d4a853]/40 bg-[#d4a853]/15 text-[#b8832e]">
            <LockKeyhole className="size-8" />
          </div>
          <CardTitle className="text-2xl font-black text-[#24284f] dark:text-[#f0e8d8]">
            Tài khoản này đang bị khóa
          </CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-[#6f675c] dark:text-[#b8b2a6]">
            Vui lòng liên hệ với chúng tôi để được hỗ trợ mở khóa lại tài khoản.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-7 py-7">
          <div className="rounded-xl border border-[#eadfcc] bg-[#fbf7ee] p-4 dark:border-[#34312d] dark:bg-[#1f1c17]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8832e]">
              Tài khoản
            </p>
            <p className="mt-2 truncate text-base font-semibold text-[#24284f] dark:text-[#f0e8d8]">
              {user?.email ?? 'Tài khoản của bạn'}
            </p>
            <p className="mt-1 text-sm text-[#7a7060] dark:text-[#b8b2a6]">
              Nếu bạn cho rằng đây là nhầm lẫn, hãy gửi tin nhắn cho đội hỗ trợ.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#d4a853]/30 bg-[#fffaf0] p-4 text-sm leading-6 text-[#5f5546] dark:bg-[#201b12] dark:text-[#d8d0c2]">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-[#b8832e]" />
            <p>
              Khi liên hệ, bạn có thể gửi kèm email đăng nhập để chúng tôi kiểm tra và phản hồi nhanh hơn.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-[#eadfcc] bg-[#fbf7ee] px-7 py-6 sm:flex-row dark:border-[#34312d] dark:bg-[#141311]">
          <Button
            asChild
            className="h-11 w-full bg-[#d4a853] px-5 text-sm font-bold text-[#17130b] hover:bg-[#c99a3f] sm:flex-1"
          >
            <Link href="https://www.facebook.com" target="_blank" rel="noreferrer">
              Liên hệ Facebook
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToLogin}
            className="h-11 w-full border-[#d8cbb7] bg-white px-5 text-sm font-bold text-[#24284f] hover:bg-[#f5efe4] sm:flex-1 dark:border-[#34312d] dark:bg-[#171614] dark:text-[#f0e8d8] dark:hover:bg-[#24211d]"
          >
            <ArrowLeft className="size-4" />
            Quay lại login
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
