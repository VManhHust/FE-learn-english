'use client'

import { useState } from 'react'
import { faqData } from '@/lib/i18n/faq'

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-16 space-y-10" style={{ backgroundColor: '#fff' }}>
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-sans font-black" style={{ color: '#1a1a2e' }}>
          {faqData.title}
        </h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: '#6b7280' }}>
          {faqData.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {faqData.categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(i)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === i ? '#1a1a2e' : 'transparent',
              color: activeCategory === i ? '#fff' : '#6b7280',
              border: activeCategory === i ? 'none' : '1px solid #e5e7eb',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto space-y-2">
        {faqData.items.map((faq, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium"
              style={{ color: '#1a1a2e', backgroundColor: '#fff' }}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span>{faq.q}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}
                className="shrink-0 transition-transform"
                style={{ transform: openIndex === i ? 'rotate(180deg)' : 'none', color: '#9ca3af' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#4b5563', backgroundColor: '#fff' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: '#6b7280' }}>
          {faqData.contactNote}
        </p>
        <button
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          {faqData.contactCta}
        </button>
      </div>
    </section>
  )
}
