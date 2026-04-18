import { Suspense } from 'react'
import { AuthProvider } from '@/lib/auth/AuthContext'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex" style={{ backgroundColor: '#f5f0e8' }}>
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
          style={{ backgroundColor: '#ede4d0' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #b8a87a 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              opacity: 0.18,
            }}
          />
          <div className="relative z-10">
            <span className="text-2xl font-display font-semibold" style={{ color: '#c8a84b' }}>
              LinguaFlow
            </span>
          </div>
          <div className="relative z-10 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#c8a84b' }}>
                English for professionals
              </p>
              <h1 className="text-4xl leading-snug" style={{ color: '#2c2c2c' }}>
                <span className="font-sans font-black" style={{ letterSpacing: '-0.03em' }}>
                  English for
                </span>{' '}
                <span className="font-display italic font-normal" style={{ color: '#c8a84b' }}>
                  WORKING PEOPLE
                </span>
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#7a7060' }}>
                Read BBC news, listen to TED podcasts, watch movies with bilingual subtitles,
                contextual vocabulary and integrated pronunciation practice.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                { icon: '📰', text: '1,000+ articles from BBC, CNN, The Guardian' },
                { icon: '🎧', text: 'Listening practice with original audio & dictation' },
                { icon: '🃏', text: 'Smart flashcards with spaced repetition algorithm' },
                { icon: '📈', text: 'Track daily and weekly progress' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm" style={{ color: '#4a4030' }}>
                  <span className="mt-0.5 text-base leading-none">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 space-y-4">
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ backgroundColor: 'rgba(255,252,245,0.6)', border: '1px solid #e0d8c8' }}
            >
              <p className="text-sm italic leading-relaxed" style={{ color: '#4a4030' }}>
                &ldquo;After 3 months using LinguaFlow 20 minutes a day, I can now confidently
                communicate with foreign colleagues without translating in my head.&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: '#c8a84b', color: '#fff' }}
                >
                  M
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#2c2c2c' }}>Minh Tuan</p>
                  <p className="text-xs" style={{ color: '#7a7060' }}>Software Engineer · B1 to C1</p>
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              {[
                { value: '50k+', label: 'Learners' },
                { value: '4.9★', label: 'Rating' },
                { value: '92%', label: 'Goal achieved' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-lg font-semibold font-display" style={{ color: '#c8a84b' }}>{value}</p>
                  <p className="text-xs" style={{ color: '#7a7060' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  )
}
