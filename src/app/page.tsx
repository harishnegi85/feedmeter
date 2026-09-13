import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: 'calc(100vh - 57px)' }} className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center flex-1 px-6 py-24">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: '#1e1433', color: '#a78bfa', border: '1px solid #4c1d95' }}>
          Free & open source · No sign-up for audience
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
          Live feedback,{' '}
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            instantly
          </span>
        </h1>

        <p className="text-lg max-w-xl mb-10" style={{ color: 'var(--text-muted)' }}>
          Create polls, word clouds, and Q&A for your session. Audience joins with a code — no app download, no account needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/login" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Start Presenting
          </Link>
          <Link href="/join" className="btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Join a Session
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📊', title: 'Multiple Choice Polls', desc: 'Ask questions with up to 6 options. See live bar charts update as votes come in.' },
            { icon: '☁️', title: 'Word Clouds', desc: 'Collect open-ended words and watch the cloud grow in real-time.' },
            { icon: '⭐', title: 'Rating Scales', desc: 'Collect 1–5 star ratings and see the distribution instantly.' },
          ].map(f => (
            <div key={f.title} className="card">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          {[
            { step: '1', title: 'Create a session', desc: 'Sign in as a presenter and build your slide deck of questions.' },
            { step: '2', title: 'Share the code', desc: 'Show the 6-letter code or QR link — audience visits feedmeter.app/join.' },
            { step: '3', title: 'See results live', desc: 'Charts update in real-time as audience submits responses.' },
          ].map(s => (
            <div key={s.step} className="flex-1 flex gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                style={{ background: 'var(--primary)', color: 'white' }}>
                {s.step}
              </div>
              <div>
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
