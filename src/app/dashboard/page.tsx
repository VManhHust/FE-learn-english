import Link from 'next/link'
import d, { extra } from '@/lib/i18n/dashboard'
import Header from '@/components/layout/Header'
import FAQ from '@/components/layout/FAQ'
import Footer from '@/components/layout/Footer'

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] dark:bg-[#0f1117]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="space-y-20 pb-20">

      {/* Hero */}
      <section
        className="rounded-2xl overflow-hidden px-10 py-16 flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800"
      >
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-sans font-black leading-tight text-[#1a1a2e] dark:text-gray-100">
            {d.hero.title}
          </h1>
          <p className="text-base leading-relaxed text-[#4a4a6a] dark:text-gray-300">
            {d.hero.desc1}<strong>{d.hero.desc2}</strong>{d.hero.desc3}
            <strong>{d.hero.desc4}</strong>{d.hero.desc5}
            <strong>{d.hero.desc6}</strong>{d.hero.desc7}
          </p>
          <Link
            href="/dashboard/lessons"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#3b4fd8' }}
          >
            {d.hero.cta}
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {['🎧', '📖', '🎤', '📊'].map((icon, i) => (
              <div
                key={i}
                className={`rounded-2xl flex items-center justify-center text-5xl ${
                  ['bg-blue-100 dark:bg-blue-900/30', 'bg-purple-100 dark:bg-purple-900/30', 'bg-green-100 dark:bg-green-900/30', 'bg-yellow-100 dark:bg-yellow-900/30'][i]
                }`}
                style={{
                  height: 120,
                  width: 120,
                }}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methods */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {d.methods.title}
          </h2>
          <p className="text-base max-w-xl mx-auto text-[#6b7280] dark:text-gray-400">
            {d.methods.subtitle1}<strong>{d.methods.subtitle2}</strong>{d.methods.subtitle3}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {d.methods.steps.map((step, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div
                className="h-40 flex items-center justify-center text-6xl bg-gradient-to-br"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, ${step.color}22, ${step.color}44)` 
                }}
              >
                {step.icon}
              </div>
              <div className="p-4 space-y-2 bg-white dark:bg-[#1a1d27]">
                <h3 className="font-bold text-sm leading-snug text-[#1a1a2e] dark:text-gray-100">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-[#6b7280] dark:text-gray-400">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Smart learning heading */}
      <section className="text-center space-y-3">
        <h2 className="text-3xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
          {d.smart.title}
        </h2>
        <p className="text-base max-w-lg mx-auto text-[#6b7280] dark:text-gray-400">
          {d.smart.subtitle1}<strong>{d.smart.subtitle2}</strong>
          {d.smart.subtitle3}<strong>{d.smart.subtitle4}</strong>
        </p>
      </section>

      {/* Dictation feature */}
      <section className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-4">
          <span
            className="inline-block text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
            style={{ color: '#3b4fd8' }}
          >
            {d.dictation.badge}
          </span>
          <h3 className="text-2xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {d.dictation.title}
          </h3>
          <p className="text-sm leading-relaxed text-[#4b5563] dark:text-gray-300">
            {d.dictation.desc1}<strong>{d.dictation.desc2}</strong>
            {d.dictation.desc3}<strong>{d.dictation.desc4}</strong>
            {d.dictation.desc5}<strong>{d.dictation.desc6}</strong>
            {d.dictation.desc7}
          </p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#3b4fd8' }}
          >
            {d.dictation.cta} <span>&#8250;</span>
          </button>
        </div>
        <div
          className="flex-1 rounded-2xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/30"
          style={{ minHeight: 280 }}
        >
          <span style={{ fontSize: 100 }}>🎧</span>
        </div>
      </section>

      {/* Shadowing feature */}
      <section className="flex flex-col md:flex-row-reverse items-center gap-12">
        <div className="flex-1 space-y-4">
          <span
            className="inline-block text-xs px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
            style={{ color: '#7c3aed' }}
          >
            {d.shadowing.badge}
          </span>
          <h3 className="text-2xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {d.shadowing.title}
          </h3>
          <p className="text-sm leading-relaxed text-[#4b5563] dark:text-gray-300">
            {d.shadowing.desc1}<strong>{d.shadowing.desc2}</strong>
            {d.shadowing.desc3}<strong>{d.shadowing.desc4}</strong>
            {d.shadowing.desc5}<strong>{d.shadowing.desc6}</strong>
            {d.shadowing.desc7}<strong>{d.shadowing.desc8}</strong>
            {d.shadowing.desc9}
          </p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#7c3aed' }}
          >
            {d.shadowing.cta} <span>&#8250;</span>
          </button>
        </div>
        <div
          className="flex-1 rounded-2xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30"
          style={{ minHeight: 280 }}
        >
          <span style={{ fontSize: 100 }}>🎤</span>
        </div>
      </section>

      {/* Error analysis feature */}
      <section className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-4">
          <span
            className="inline-block text-xs px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"
            style={{ color: '#c2410c' }}
          >
            {d.error.badge}
          </span>
          <h3 className="text-2xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {d.error.title}
          </h3>
          <p className="text-sm leading-relaxed text-[#4b5563] dark:text-gray-300">
            {d.error.desc1}<strong>{d.error.desc2}</strong>{d.error.desc3}
          </p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            {d.error.cta} <span>&#8250;</span>
          </button>
        </div>
        <div
          className="flex-1 rounded-2xl flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30"
          style={{ minHeight: 280 }}
        >
          <span style={{ fontSize: 100 }}>📊</span>
        </div>
      </section>

      {/* Progress tracking feature */}
      <section className="flex flex-col md:flex-row-reverse items-center gap-12">
        <div className="flex-1 space-y-4">
          <span
            className="inline-block text-xs px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
            style={{ color: '#16a34a' }}
          >
            {extra.progress.badge}
          </span>
          <h3 className="text-2xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {extra.progress.title}
          </h3>
          <p className="text-sm leading-relaxed text-[#4b5563] dark:text-gray-300">
            {extra.progress.desc}
          </p>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            {extra.progress.cta} <span>&#8250;</span>
          </button>
        </div>
        <div
          className="flex-1 rounded-2xl p-6 space-y-2 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
          style={{ minHeight: 280 }}
        >
          <p className="text-xs font-semibold mb-4 text-[#6b7280] dark:text-gray-400">Ranking Progress</p>
          {extra.progress.levels.map((level, i) => (
            <div key={level} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6'][i] }}
              />
              <span className="text-xs text-[#374151] dark:text-gray-300">{level}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#e5e7eb' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${[20,35,55,70,85,95][i]}%`,
                    backgroundColor: ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6'][i],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section
        className="rounded-2xl px-8 py-14 space-y-10 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800"
      >
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {extra.why.title}
          </h2>
          <p className="text-base max-w-md mx-auto text-[#6b7280] dark:text-gray-400">
            {extra.why.subtitle1}<strong>{extra.why.subtitle2}</strong>{extra.why.subtitle3}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {extra.why.features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 space-y-3 bg-white dark:bg-[#1a1d27]"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: f.color, opacity: 0.9 }}
              >
                {f.icon}
              </div>
              <h4 className="font-bold text-base text-[#1a1a2e] dark:text-gray-100">{f.title}</h4>
              <p className="text-sm leading-relaxed text-[#6b7280] dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Advisors */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {extra.advisors.title}
          </h2>
          <p className="text-base max-w-lg mx-auto text-[#6b7280] dark:text-gray-400">
            {extra.advisors.subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {extra.advisors.people.map((p, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
              <div
                className="h-48 flex flex-col justify-end p-4 relative"
                style={{ backgroundColor: p.bg }}
              >
                <span
                  className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                >
                  {p.badge}
                </span>
                <div className="text-5xl text-center mb-2">👤</div>
                <p className="font-bold text-white text-sm">{p.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{p.role}</p>
              </div>
              <div className="p-4 bg-white dark:bg-[#1a1d27]">
                <p className="text-xs leading-relaxed text-[#4b5563] dark:text-gray-300">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            {extra.advisors.cta} &#8594;
          </button>
        </div>
      </section>

      {/* Reviews */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {extra.reviews.title}
          </h2>
          <p className="text-sm max-w-lg mx-auto text-[#6b7280] dark:text-gray-400">
            {extra.reviews.subtitle}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span style={{ color: '#f59e0b', fontSize: 20 }}>{'\u2605\u2605\u2605\u2605\u2605'}</span>
            <span className="font-bold text-lg text-[#1a1a2e] dark:text-gray-100">{extra.reviews.rating}</span>
          </div>
          <p className="text-xs text-[#9ca3af] dark:text-gray-500">{extra.reviews.ratingNote}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {extra.reviews.items.map((r, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 space-y-3 bg-white dark:bg-[#1a1d27]"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#1a1a2e] dark:text-gray-100">{r.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#f3f4f6] dark:bg-[#252836] text-[#6b7280] dark:text-gray-400">
                  {r.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#f59e0b', fontSize: 14 }}>
                  {Array(r.stars).fill('\u2605').join('')}
                </span>
                <span className="text-xs text-[#9ca3af] dark:text-gray-500">{r.date}</span>
              </div>
              <p className="text-xs leading-relaxed text-[#4b5563] dark:text-gray-300">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App download CTA */}
      <section
        className="rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700"
      >
        <div className="space-y-2">
          <h3 className="text-xl font-sans font-black text-[#1a1a2e] dark:text-gray-100">
            {extra.app.title}
          </h3>
          <p className="text-sm max-w-sm text-[#4b5563] dark:text-gray-300">
            {extra.app.desc}
          </p>
        </div>
        <button
          className="shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ backgroundColor: '#1a1a2e' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {extra.app.cta}
        </button>
      </section>

        </div>
      </main>
      <div className="px-6">
        <FAQ />
      </div>
      <Footer />
    </div>
  )
}
