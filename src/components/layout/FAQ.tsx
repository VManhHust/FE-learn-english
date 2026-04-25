'use client'

import { useState } from 'react'
import { faqData } from '@/lib/i18n/faq'

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-16 space-y-10 bg-white dark:bg-[#0f1117]">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
          {faqData.title}
        </h2>
        <p className="text-sm max-w-md mx-auto text-[#6b7280] dark:text-gray-400">
          {faqData.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {faqData.categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === i 
                ? 'bg-[#1a1a2e] dark:bg-blue-600 text-white' 
                : 'bg-transparent text-[#6b7280] dark:text-gray-400 border border-[#e5e7eb] dark:border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto space-y-2">
        {faqData.items.map((faq, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-[#e5e7eb] dark:border-gray-700">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-[#1a1a2e] dark:text-gray-100 bg-white dark:bg-[#1a1d27]"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span>{faq.q}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}
                className="shrink-0 transition-transform text-[#9ca3af] dark:text-gray-500"
                style={{ transform: openIndex === i ? 'rotate(180deg)' : 'none' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4 text-sm leading-relaxed text-[#4b5563] dark:text-gray-300 bg-white dark:bg-[#1a1d27]">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-[#6b7280] dark:text-gray-400">
          {faqData.contactNote}
        </p>
        <button
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#1a1a2e] dark:bg-blue-600 hover:opacity-90 transition-opacity"
        >
          {faqData.contactCta}
        </button>
      </div>
    </section>
  )
}
