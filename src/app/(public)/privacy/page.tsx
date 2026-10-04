import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/layout/Logo'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chính sách bảo mật của LinguaFlow — cam kết bảo vệ thông tin cá nhân người dùng.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <header className="border-b border-[#e2d8c7] bg-white/90 px-6 py-4 dark:border-[#332d23] dark:bg-[#11100e]/90">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-black text-[#1a1a2e] dark:text-gray-100">
          Chính sách bảo mật
        </h1>
        <div className="prose prose-sm max-w-none text-[#4b5563] dark:text-gray-300">
          <p>Cập nhật lần cuối: Tháng 10, 2026</p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">1. Thu thập thông tin</h2>
          <p>
            LinguaFlow thu thập thông tin cá nhân khi bạn đăng ký tài khoản, bao gồm: tên hiển thị, địa chỉ email,
            và dữ liệu học tập (tiến độ bài học, từ vựng đã lưu, ghi chú).
          </p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">2. Sử dụng thông tin</h2>
          <p>
            Thông tin của bạn được sử dụng để cung cấp và cải thiện dịch vụ, cá nhân hóa trải nghiệm học tập,
            và gửi thông báo liên quan đến tài khoản.
          </p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">3. Bảo mật dữ liệu</h2>
          <p>
            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn bằng các biện pháp bảo mật tiêu chuẩn ngành,
            bao gồm mã hóa dữ liệu và kiểm soát truy cập.
          </p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">4. Liên hệ</h2>
          <p>
            Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ qua email tại trang web của chúng tôi.
          </p>
        </div>
      </main>
    </div>
  )
}
