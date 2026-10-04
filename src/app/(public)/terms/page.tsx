import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/layout/Logo'

export const metadata: Metadata = {
  title: 'Điều khoản dịch vụ',
  description: 'Điều khoản dịch vụ của LinguaFlow — quy định sử dụng nền tảng học tiếng Anh.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-[#0f0e0c]">
      <header className="border-b border-[#e2d8c7] bg-white/90 px-6 py-4 dark:border-[#332d23] dark:bg-[#11100e]/90">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-black text-[#1a1a2e] dark:text-gray-100">
          Điều khoản dịch vụ
        </h1>
        <div className="prose prose-sm max-w-none text-[#4b5563] dark:text-gray-300">
          <p>Cập nhật lần cuối: Tháng 10, 2026</p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc sử dụng LinguaFlow, bạn đồng ý tuân thủ các điều khoản dịch vụ này.
            Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.
          </p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">2. Tài khoản người dùng</h2>
          <p>
            Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình. LinguaFlow không chịu trách nhiệm
            cho các hoạt động trái phép trên tài khoản của bạn.
          </p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">3. Nội dung và bản quyền</h2>
          <p>
            Tất cả nội dung trên LinguaFlow (bài học, giao diện, tính năng) thuộc quyền sở hữu của
            LINGUAFLOW CO., LTD. Bạn không được sao chép hoặc phân phối lại nội dung mà không có sự cho phép.
          </p>
          <h2 className="text-lg font-bold text-[#1a1a2e] dark:text-gray-100">4. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có quyền thay đổi các điều khoản này bất kỳ lúc nào.
            Các thay đổi sẽ có hiệu lực ngay khi được công bố trên trang web.
          </p>
        </div>
      </main>
    </div>
  )
}
