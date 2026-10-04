import DashboardPage from '@/app/dashboard/page'
import { organizationJsonLd, webSiteJsonLd, faqPageJsonLd } from '@/lib/seo/jsonld'
import { faqData } from '@/lib/i18n/faq'

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationJsonLd(),
            webSiteJsonLd(),
            faqPageJsonLd(faqData.items),
          ]),
        }}
      />
      <DashboardPage />
    </>
  )
}
