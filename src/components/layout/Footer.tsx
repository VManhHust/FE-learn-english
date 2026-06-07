import Link from 'next/link'
import { ArrowUpRight, Mail } from 'lucide-react'
import Logo from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { footerData } from '@/lib/i18n/faq'

const featureLinks = [
  { label: 'Bài học Dictation', href: '/dashboard/topics' },
  { label: 'Luyện nói', href: '/dashboard/speaking' },
  { label: 'Từ vựng', href: '/dashboard/vocabulary' },
  { label: 'Ghi chú của tôi', href: '/dashboard/notes' },
  { label: 'Luyện thi TOEIC', href: '/dashboard/toeic' },
]

const informationLinks = [
  { label: 'Về LinguaFlow', href: '/about' },
  { label: 'Blog học tiếng Anh', href: '/blog' },
  { label: 'Chính sách bảo mật', href: '/privacy' },
  { label: 'Điều khoản dịch vụ', href: '/terms' },
  { label: 'Liên hệ và góp ý', href: '/contact' },
]

const socialLinks = [
  { label: 'Facebook', icon: 'facebook' },
  { label: 'Instagram', icon: 'instagram' },
  { label: 'YouTube', icon: 'youtube' },
  { label: 'LinkedIn', icon: 'linkedin' },
]

const FACEBOOK_URL = 'https://www.facebook.com'

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-[#94a3b8]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-5">
          <div className="dark">
            <Logo size="lg" />
          </div>
          <p className="max-w-sm text-sm leading-6">{footerData.brandDesc}</p>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-[#334155] bg-[#1e293b] px-4 text-white hover:bg-[#293548] hover:text-white"
          >
            <Link href="/contact">
              <Mail className="size-4 text-[#d4a853]" />
              Liên hệ LinguaFlow
            </Link>
          </Button>
        </div>

        <FooterLinkGroup title="Tính năng" links={featureLinks} />
        <FooterLinkGroup title="Thông tin" links={informationLinks} />

        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Kết nối với chúng tôi</h3>
          <p className="mb-4 text-sm leading-6">
            Theo dõi LinguaFlow để cập nhật bài học và các mẹo luyện tiếng Anh mới nhất.
          </p>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map(({ label, icon }) => (
              <Button
                key={label}
                asChild
                variant="ghost"
                size="icon"
                className="size-10 rounded-full bg-[#1e293b] text-[#cbd5e1] hover:bg-[#d4a853] hover:text-white"
              >
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <SocialIcon name={icon} />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-[#1e293b]" />

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-center text-xs sm:flex-row sm:text-left">
        <span>{footerData.copyright}</span>
        <span>
          {footerData.madeWith}{' '}
          <strong className="text-white">{footerData.brand}</strong>
        </span>
      </div>
    </footer>
  )
}

function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    facebook: <path d="M13.5 8H16V4.5h-2.5C10.5 4.5 9 6.3 9 9v2H6v3.5h3V22h4v-7.5h3L16.5 11H13V9.3c0-.9.3-1.3.5-1.3Z" />,
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" />
      </>
    ),
    youtube: <path d="M21.5 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.7.5 7.5.5 7.5.5s5.8 0 7.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.5-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />,
    linkedin: <path d="M5.3 8.5H2V22h3.3V8.5ZM3.7 2A1.9 1.9 0 1 0 3.7 5.8 1.9 1.9 0 0 0 3.7 2ZM22 14.2c0-4.1-2.2-6-5.1-6-2.4 0-3.4 1.3-4 2.2V8.5H9.6V22H13v-6.7c0-1.8.3-3.5 2.5-3.5 2.1 0 2.2 2 2.2 3.6V22H22v-7.8Z" />,
  }

  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; href: string }>
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[#d4a853]"
            >
              {link.label}
              <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
